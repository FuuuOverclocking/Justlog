import path from 'path';
import fs from 'fs';
import ts from 'typescript';
import webpack from 'webpack';
import shortUUID from 'short-uuid';
import { MdCompiler } from './compiler/md-compiler';
import { configFactory } from './webpack-config/webpack.config';
import { format } from './utils/formatter';
import { log, assert, panic } from './utils/debug';
import { CompilerOptions, FileSystem, Target } from './types';
import { PathWithFs } from './utils/path-with-fs';

type Source = 'article.md' | 'article.tsx';
type BlogFilesPaths = Record<Source, string>;
type RequiredCompilerOptions = Required<CompilerOptions>;
type BuildStep = (
    sources: { 'article.md': string; 'article.tsx': string },
    options: RequiredCompilerOptions,
    next: () => Promise<void>,
) => Promise<void>;

// Panic or Error:
//   用户提供了错误的编译器选项时应当 panic, 立即中断程序并报错.
//   但在编译过程中, 发生错误时, 应当 throw Error, 由外层决定 Error 的处理,
//   例如, watch() 将容忍错误的发生, 等待直到源文件恢复正确.

export async function checkAndCompleteCompilerOptions(
    options: CompilerOptions,
): Promise<void> {
    assert(typeof options.inputDir === 'string', 'inputDir 应是字符串.');
    assert(typeof options.outputDir === 'string', 'outputDir 应是字符串.');
    assert(
        Array.isArray(options.targets) && options.targets.length !== 0,
        '未指定 target.',
    );
    assert(
        options.onBuildComplete == null || typeof options.onBuildComplete === 'function',
        'onBuildComplete 应为 undefined | (() => Promise<void> | void).',
    );

    if (!options.inputDir.startsWith('/')) {
        if (options.inputFileSystem) {
            panic('使用虚拟文件系统时, 必须使用绝对路径.');
        }
        options.inputDir = path.resolve(options.inputDir);
    }
    if (!options.outputDir.startsWith('/')) {
        if (options.outputFileSystem) {
            panic('使用虚拟文件系统时, 必须使用绝对路径.');
        }
        options.outputDir = path.resolve(options.outputDir);
    }

    options.inputFileSystem ??= fs;
    options.outputFileSystem ??= fs;

    options.silent = !!options.silent;
    options.onBuildComplete ??= null;
}

export namespace Rebuild {
    export async function rebuild(options: RequiredCompilerOptions) {
        const timeBegin = Date.now();

        await Promise.all([ensureInputDir(options), cleanAndEnsureOutputDir(options)]);

        const paths: BlogFilesPaths = {
            'article.md': path.join(options.inputDir, './article.md'),
            'article.tsx': path.join(options.inputDir, './article.tsx'),
        };

        const sources = await readSources(paths, options.inputFileSystem);

        // 解析编译目标, 按内在的顺序, 生成编译步骤.
        const buildSteps = resolveTargets(options.targets);
        if (buildSteps.length !== 0) {
            let i = -1;
            const next = () => {
                // 此时 buildSteps[i] 执行完成了

                i++;
                if (i === buildSteps.length) return Promise.resolve();
                return buildSteps[i](sources, options, next);
            };

            await next();
        }

        const buildTime = ((Date.now() - timeBegin) / 1000).toFixed(3);
        log.info(`编译完成, 用时 ${buildTime} 秒.`);

        if (options.onBuildComplete) {
            const timeBegin = Date.now();
            log.info(`执行 onBuildComplete...`);
            await options.onBuildComplete();
            const runningTime = ((Date.now() - timeBegin) / 1000).toFixed(3);
            log.info(`执行 onBuildComplete 完成, 用时 ${runningTime} 秒.`);
        }
    }

    async function ensureInputDir(options: RequiredCompilerOptions): Promise<void> {
        try {
            await options.inputFileSystem!.promises.mkdir(options.inputDir, {
                recursive: true,
            });
        } catch (e) {
            log.error(`无法访问 inputFileSystem 中的路径 "${options.inputDir}".`);
            throw e;
        }
    }

    async function cleanAndEnsureOutputDir(
        options: RequiredCompilerOptions,
    ): Promise<void> {
        try {
            await options.outputFileSystem.promises.rm(options.outputDir, {
                recursive: true,
                force: true,
            });
        } catch (e) {
            log.error(`无法删除 outputFileSystem 中的输出文件夹 "${options.outputDir}".`);
            throw e;
        }

        try {
            options.outputFileSystem!.promises.mkdir(options.outputDir, {
                recursive: true,
            });
        } catch (e) {
            log.error(`无法访问 outputFileSystem 中的路径 "${options.outputDir}".`);
            throw e;
        }
    }

    async function readSources(paths: BlogFilesPaths, inputFS: FileSystem) {
        const tmp = await Promise.all([
            inputFS.promises.readFile(paths['article.md'], 'utf-8').catch((e) => {
                log.error(`无法读取 "${paths['article.md']}".`);
                throw e;
            }),
            inputFS.promises.readFile(paths['article.tsx'], 'utf-8').catch((e) => {
                log.error(`无法读取 "${paths['article.tsx']}".`);
                throw e;
            }),
        ]);
        const sources = {
            'article.md': tmp[0] as string,
            'article.tsx': tmp[1] as string,
        };
        return sources;
    }

    function resolveTargets(targets: Target[]): BuildStep[] {
        const buildStepMap = {
            'blog.tsx': CompileMarkdownAndMix.step,
            'blog-bundle': CompileTsxAndPack.step,
            'zhihu.md': ConvertToZhihu.step,
        };

        const targetsSet = new Set(targets);
        const buildOrder: Target[] = [];

        if (targetsSet.has('blog-bundle')) {
            buildOrder.push('blog.tsx', 'blog-bundle');
        } else if (targetsSet.has('blog.tsx')) {
            buildOrder.push('blog.tsx');
        }

        if (targetsSet.has('zhihu.md')) {
            buildOrder.push('zhihu.md');
        }

        return buildOrder.map((target) => buildStepMap[target]);
    }
}

namespace CompileMarkdownAndMix {
    export const step: BuildStep = async (sources, options, next) => {
        const outputDir = new PathWithFs(options.outputFileSystem, options.outputDir);
        const targetPath = outputDir.join('blog.tsx');

        const mdCompiler = MdCompiler.getInstance(options);
        const blogObjectString = mdCompiler.compileMarkdown(sources['article.md']);
        const code = mixBlogIntoTsx(sources['article.tsx'], blogObjectString);

        await targetPath.write(code);
        await next();

        if (options.targets.includes('blog.tsx')) {
            const { err, result: codeFormatted } = await format(code);
            if (err) {
                log.error(err);
            }
            await targetPath.write(codeFormatted);
        } else {
            await targetPath.remove();
        }
    };

    function mixBlogIntoTsx(tsx: string, blogObjectString: string): string {
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
}

namespace CompileTsxAndPack {
    export const step: BuildStep = async (sources, options, next) => {
        const inputDir = new PathWithFs(options.inputFileSystem, options.inputDir);
        const outputDir = new PathWithFs(options.outputFileSystem, options.outputDir);

        const codeInput = await outputDir.join('blog.tsx').read();

        const sourceFile = ts.createSourceFile(
            'blog.tsx',
            codeInput,
            ts.ScriptTarget.ES2018,
            true,
            ts.ScriptKind.TSX,
        );
        const importDeclToTranspile = findImportDeclToTranspile(sourceFile);
        const codeImportTranspiled = transpileImportDecl(
            codeInput,
            importDeclToTranspile,
        );

        // 在 inputDir 下创建一个临时文件, 作为 webpack 的入口
        const tmpFilePath = inputDir.join(`.tmp.${shortUUID.generate()}.tsx`);

        await tmpFilePath.write(codeImportTranspiled);
        try {
            await pack();
        } finally {
            await tmpFilePath.remove();
        }

        const info = {
            needModule: importDeclToTranspile.map((decl) => decl.moduleRealName),
        };
        outputDir.join('blog-bundle/info.json', JSON.stringify(info));

        await next();

        async function pack() {
            const compiler = webpack(
                configFactory({
                    entry: tmpFilePath.str,
                    inputDir: options.inputDir,
                    outputDir: path.join(options.outputDir, './blog-bundle'),
                }),
            );
            compiler.inputFileSystem = options.inputFileSystem;
            compiler.outputFileSystem = options.outputFileSystem;

            await new Promise<webpack.Stats | undefined>((resolve, reject) => {
                compiler.run((err, stats) => {
                    if (err) reject(err);
                    resolve(stats);
                });
            });
        }
    };

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

    function transpileImportDecl(
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

namespace ConvertToZhihu {
    export const step: BuildStep = async (sources, options, next) => {
        await next();
    };
}
