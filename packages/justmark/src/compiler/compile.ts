import ts from 'typescript';
import shortUUID from 'short-uuid';
import webpack from 'webpack';
import path from 'path-nice';
import {
    CompilerOptions,
    CompilerInnerOptions,
    allowedTargets,
    BlogMeta,
} from '../types';
import { log, assert } from '../utils/debug';
import { MdCompiler } from './markdown/md-compiler';
import { configFactory } from './webpack.config';

export function checkAndGetInnerOptions(opts: CompilerOptions): CompilerInnerOptions {
    const result: Partial<CompilerInnerOptions> = {};

    assert(typeof opts.inputDir === 'string', 'inputDir 应是字符串.');
    assert(typeof opts.outputDir === 'string', 'outputDir 应是字符串.');

    if (opts.inputFileSystem) {
        result.inputDir = path.posix.bindFS(opts.inputFileSystem as any)(opts.inputDir);
        assert(result.inputDir.isAbsolute(), '使用虚拟文件系统时, 必须使用绝对路径.');
    } else {
        result.inputDir = path(opts.inputDir).toAbsolute();
    }
    if (opts.outputFileSystem) {
        result.outputDir = path.posix.bindFS(opts.outputFileSystem as any)(
            opts.outputDir,
        );
        assert(result.outputDir.isAbsolute(), '使用虚拟文件系统时, 必须使用绝对路径.');
    } else {
        result.outputDir = path(opts.outputDir).toAbsolute();
    }

    assert(Array.isArray(opts.targets) && opts.targets.length !== 0, '未指定 target.');
    opts.targets.forEach((target) => {
        assert(allowedTargets.includes(target), '未知的构建目标: ' + target);
    });

    result.targets = new Set(opts.targets);

    assert(
        opts.onBuildComplete == null || typeof opts.onBuildComplete === 'function',
        '若指定 onBuildComplete, 应为 () => Promise<void> | void.',
    );
    result.onBuildComplete = opts.onBuildComplete;
    result.blogBundle = opts.blogBundle;
    if (result.blogBundle?.addPathToMeta) {
        assert(
            typeof result.blogBundle.blogRootDir === 'string',
            '启用了 addPathToMeta 时必须指定 blogRootDir.',
        );
    }

    return result as CompilerInnerOptions;
}

export async function compile(opts: CompilerInnerOptions): Promise<void> {
    const timeBegin = Date.now();

    assert(await opts.inputDir.isDir(), 'inputDir 不存在或不是文件夹.');
    await opts.outputDir.emptyDir();

    const inputs = {
        'article.md': await opts.inputDir.join('article.md').readFileToString(),
        'article.tsx': await opts.inputDir.join('article.tsx').readFileToString(),
    };

    if (opts.targets.has('blog-bundle')) {
        await TargetBlogBundle.compile(inputs, opts);
    }

    const elapsed = ((Date.now() - timeBegin) / 1000).toFixed(3);

    if (!opts.onBuildComplete) {
        log.info(`编译完成, 用时 ${elapsed} 秒.`);
    } else {
        log.info(`编译完成, 用时 ${elapsed} 秒. 正在执行 onBuildComplete...`);

        const timeBegin = Date.now();
        await opts.onBuildComplete();
        const _elapsed = ((Date.now() - timeBegin) / 1000).toFixed(3);

        log.info(`执行 onBuildComplete 完成, 用时 ${_elapsed} 秒.`);
    }
}

namespace TargetBlogBundle {
    const webpackConfig = (() => {
        let cache = void 0 as any;
        return (opts: CompilerInnerOptions) => {
            cache ??= configFactory({
                inputDir: opts.inputDir.raw,
                outputDir: opts.outputDir.join('./blog-bundle').raw,
            });
            return cache as webpack.Configuration;
        };
    })();

    export async function compile(
        inputs: {
            'article.md': string;
            'article.tsx': string;
        },
        opts: CompilerInnerOptions,
    ) {
        const promiseCopyResDir = copyResDir(opts);

        let code = inputs['article.tsx'];

        const mdCompiler = MdCompiler.getInstance(opts);
        let { meta, content } = mdCompiler.compileMarkdown(inputs['article.md']);

        if (opts.blogBundle?.addPathToMeta) {
            meta = addPathToMeta(meta, opts);
        }

        const stringedBlogObject = genStringedBlogObject(meta, content);
        code = injectStringedBlogObjectIntoTsx(code, stringedBlogObject);

        let blogModuleInfo: { needModule: string[] };
        [code, blogModuleInfo] = transpileImportDeclaration(code);

        // 在 inputDir 下创建一个临时文件, 作为 webpack 的入口
        const tmpFile = opts.inputDir.join(`.tmp.${shortUUID.generate()}.tsx`);

        await tmpFile.writeFile(code);
        try {
            await pack();
            await writeInfo();
            await promiseCopyResDir;
        } finally {
            await tmpFile.remove();
        }

        async function pack() {
            const config = webpackConfig(opts);
            config.entry = tmpFile.raw;
            const compiler = webpack(config);
            compiler.inputFileSystem = opts.inputDir.fs;
            compiler.outputFileSystem = opts.outputDir.fs;

            await new Promise<webpack.Stats | undefined>((resolve, reject) => {
                compiler.run((err, stats) => {
                    if (err) reject(err);
                    resolve(stats);
                });
            });
        }
        async function writeInfo() {
            const info = {
                ...blogModuleInfo,
            };
            await opts.outputDir.join('blog-bundle/info.json').writeJSON(info);
        }
    }

    async function copyResDir(opts: CompilerInnerOptions): Promise<void> {
        const inputRes = path(opts.inputDir.join('res'));
        const outputRes = path(opts.outputDir.join('blog-bundle/res'));

        if (await inputRes.isDir()) {
            await inputRes.copy(outputRes);
        }
    }

    function addPathToMeta(meta: BlogMeta, opts: CompilerInnerOptions): BlogMeta {
        meta.path = opts.inputDir
            .toRelative(opts.blogBundle!.blogRootDir!)
            .separator('/').raw;

        const parts = meta.path.split('/');
        assert(
            parts.length >= 1 && parts[0] !== '..' && parts[0] !== '.',
            'inputDir 似乎不在 blogRootDir 目录下',
        );

        return meta;
    }

    function genStringedBlogObject(meta: BlogMeta, content: string): string {
        return `{ ...${JSON.stringify(meta, null, 4)}, content: ${content} }`;
    }

    function injectStringedBlogObjectIntoTsx(
        tsx: string,
        blogObjectString: string,
    ): string {
        const blogDeclaration = 'declare function blog(): Blog;';
        if (tsx.indexOf(blogDeclaration) === -1) {
            throw new Error(`在 article.tsx 未找到 \`${blogDeclaration}\` 声明.`);
        }

        tsx = tsx.replace(
            blogDeclaration,
            `function blog(): Blog { return ${blogObjectString}; }`,
        );

        return tsx;
    }

    function transpileImportDeclaration(
        code: string,
    ): [string, { needModule: string[] }] {
        const sourceFile = ts.createSourceFile(
            'blog.tsx',
            code,
            ts.ScriptTarget.ES2018,
            true,
            ts.ScriptKind.TSX,
        );
        const importDeclToTranspile = findImportDeclToTranspile(sourceFile);
        code = _transpileImportDeclaration(code, importDeclToTranspile);
        const info = {
            needModule: importDeclToTranspile.map((decl) => decl.moduleRealName),
        };
        return [code, info];

        function findImportDeclToTranspile(sourceFile: ts.SourceFile): Array<{
            name: string;
            moduleName: string;
            moduleRealName: string;
            pos: number;
            end: number;
        }> {
            const importDeclToTranspile: Array<{
                name: string;
                moduleName: string;
                moduleRealName: string;
                pos: number;
                end: number;
            }> = [];

            ts.forEachChild(sourceFile, (node) => {
                const _node = node as ts.ImportDeclaration;
                if (_node.kind !== ts.SyntaxKind.ImportDeclaration) return;

                const moduleSpecifier = _node.moduleSpecifier as ts.StringLiteral;
                if (moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
                    throw new Error('import 语句不符合 TypeScript 语法.');
                }

                const moduleName = moduleSpecifier.text;
                if (
                    !moduleName.startsWith('./') &&
                    !moduleName.startsWith('../') &&
                    !moduleName.startsWith('/') &&
                    !moduleName.startsWith('#')
                ) {
                    throw new Error('不能在 JustMark 中直接使用非相对导入.');
                }
                if (!moduleName.startsWith('#')) return;

                const importClause = _node.importClause as ts.ImportClause;
                if (importClause.isTypeOnly) {
                    throw new Error('不能在 JustMark 中使用 import type ...');
                }
                if (importClause.namedBindings) {
                    throw new Error('不能在 JustMark 中使用导入命名绑定.');
                }
                if (!importClause.name) {
                    throw new Error('非相对导入的 importClause 的标识符不存在.');
                }

                importDeclToTranspile.push({
                    name: importClause.name.escapedText as string,
                    moduleName,
                    moduleRealName: moduleName.substring(1),
                    pos: _node.pos + _node.getLeadingTriviaWidth(),
                    end: _node.end,
                });
            });

            return importDeclToTranspile;
        }

        function _transpileImportDeclaration(
            codeInput: string,
            importDeclToTranspile: Array<{
                name: string;
                moduleName: string;
                moduleRealName: string;
                pos: number;
                end: number;
            }>,
        ): string {
            const originalParts: string[] = [];
            let pos = 0;
            for (const decl of importDeclToTranspile) {
                originalParts.push(codeInput.substring(pos, decl.pos));
                pos = decl.end;
            }
            originalParts.push(codeInput.substring(pos));

            let codeImportTranspiled = '';
            for (const [i, decl] of importDeclToTranspile.entries()) {
                codeImportTranspiled += originalParts[i];
                codeImportTranspiled += `const ${decl.name} = giveme('${decl.moduleRealName}');`;
            }
            codeImportTranspiled += originalParts[originalParts.length - 1];

            return codeImportTranspiled;
        }
    }
}
