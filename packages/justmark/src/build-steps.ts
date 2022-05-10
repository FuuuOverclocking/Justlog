import path from 'path';
import fs from 'fs';
import ts from 'typescript';
import webpack from 'webpack';
import { MdCompiler } from './compiler/md-compiler';
import { configFactory } from './webpack-config/webpack.config';
import { format } from './utils/formatter';
import { debug, panic, panicIf } from './utils/debug';
import { noop } from './utils/tools';
import { CompilerOptions, FileSystem, Target } from './types';

type Source = 'article.md' | 'article.tsx';
type BlogFilesPaths = Record<Source, string>;
type RequiredCompilerOptions = Required<CompilerOptions>;
type BuildStep = (
    sources: { 'article.md': string; 'article.tsx': string },
    options: RequiredCompilerOptions,
    next: () => Promise<void>,
) => Promise<void>;

export async function checkAndCompleteCompilerOptions(
    options: CompilerOptions,
): Promise<void> {
    panicIf(typeof options.inputDir !== 'string', 'inputDir 不是字符串.');
    panicIf(typeof options.outputDir !== 'string', 'outputDir 不是字符串.');
    panicIf(
        !Array.isArray(options.targets) || options.targets.length === 0,
        '未指定 target.',
    );
    panicIf(
        options.onBuildComplete != null && typeof options.onBuildComplete !== 'function',
        'onBuildComplete 应为 undefined | (() => void).',
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
    options.onBuildComplete ??= noop;
}

export namespace Rebuild {
    export async function rebuild(options: RequiredCompilerOptions) {
        const timeBegin = Date.now();

        await ensureIODir(options);

        const paths: BlogFilesPaths = {
            'article.md': path.join(options.inputDir, './article.md'),
            'article.tsx': path.join(options.inputDir, './article.tsx'),
        };

        const sources = await readSources(paths, options.inputFileSystem);

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
        debug.withTime.info(`编译完成, 用时 ${buildTime} 秒.`);
    }

    async function ensureIODir(options: RequiredCompilerOptions): Promise<void> {
        await Promise.all([ensureInputDir(), cleanAndEnsureOutputDir()]);

        async function ensureInputDir() {
            try {
                await options.inputFileSystem!.promises.mkdir(options.inputDir, {
                    recursive: true,
                });
            } catch (e) {
                debug.withTime.error(
                    `无法访问 inputFileSystem 中的路径 "${options.inputDir}".`,
                );
                throw e;
            }
        }

        async function cleanAndEnsureOutputDir() {
            try {
                await options.outputFileSystem.promises.rm(options.outputDir, {
                    recursive: true,
                    force: true,
                });
            } catch (e) {
                debug.withTime.error(
                    `无法删除 outputFileSystem 中的输出文件夹 "${options.outputDir}".`,
                );
                throw e;
            }

            try {
                options.outputFileSystem!.promises.mkdir(options.outputDir, {
                    recursive: true,
                });
            } catch (e) {
                debug.withTime.error(
                    `无法访问 outputFileSystem 中的路径 "${options.outputDir}".`,
                );
                throw e;
            }
        }
    }

    async function readSources(paths: BlogFilesPaths, inputFS: FileSystem) {
        const tmp = await Promise.all([
            inputFS.promises.readFile(paths['article.md'], 'utf-8').catch((e) => {
                debug.withTime.error(`无法读取 "${paths['article.md']}".`);
                throw e;
            }),
            inputFS.promises.readFile(paths['article.tsx'], 'utf-8').catch((e) => {
                debug.withTime.error(`无法读取 "${paths['article.tsx']}".`);
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
            'blog-bundle.js': CompileTsxAndPack.step,
            'zhihu.md': ConvertToZhihu.step,
        };

        const targetsSet = new Set(targets);
        const buildOrder: Target[] = [];

        if (targetsSet.has('blog-bundle.js')) {
            buildOrder.push('blog.tsx', 'blog-bundle.js');
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
        const mdCompiler = MdCompiler.getInstance(options);
        const blogObjectString = mdCompiler.compileMarkdown(sources['article.md']);
        const code = mixBlogIntoTsx(sources['article.tsx'], blogObjectString);

        await FSTools.OutputDir.writeFile(options, './blog.tsx', code);
        await next();

        if (options.targets.includes('blog.tsx')) {
            const { err, result: codeFormatted } = await format(code);
            if (err) {
                debug.withTime.error(err);
            }
            await FSTools.OutputDir.writeFile(options, './blog.tsx', codeFormatted);
        } else {
            await FSTools.OutputDir.unlink(options, './blog.tsx');
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
        const codeInput = await FSTools.OutputDir.readFile(options, './blog.tsx');

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
        // prettier-ignore
        const randomString = Math.floor(
            Math.random() * Number.MAX_SAFE_INTEGER
        ).toString(36);
        const tmpFilePath = `./.tmp.${randomString}.tsx`;

        await FSTools.InputDir.writeFile(options, tmpFilePath, codeImportTranspiled);
        try {
            await pack();
        } finally {
            await FSTools.InputDir.unlink(options, tmpFilePath);
        }

        await next();

        async function pack() {
            const compiler = webpack(
                configFactory({
                    entry: path.join(options.inputDir, tmpFilePath),
                    inputDir: options.inputDir,
                    outputDir: options.outputDir,
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
        pos: number;
        end: number;
    }> {
        const importDeclToTranspile: Array<{
            name: string;
            moduleName: string;
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
            const moduleRealName = decl.moduleName.substring(1); // 移除了开头的 #
            codeImportTranspiled += `const ${decl.name} = giveme('${moduleRealName}');`;
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

namespace FSTools {
    class IODir {
        constructor(private isInput: boolean) {}
        private fs(options: RequiredCompilerOptions) {
            return this.isInput
                ? options.inputFileSystem.promises
                : options.outputFileSystem.promises;
        }
        private join(options: RequiredCompilerOptions, relativePath: string) {
            return path.join(
                this.isInput ? options.inputDir : options.outputDir,
                relativePath,
            );
        }

        public readFile(
            options: RequiredCompilerOptions,
            relativePath: string,
        ): Promise<string> {
            return this.fs(options).readFile(this.join(options, relativePath), {
                encoding: 'utf-8',
            }) as Promise<string>;
        }

        public writeFile(
            options: RequiredCompilerOptions,
            relativePath: string,
            code: string,
        ): Promise<void> {
            return this.fs(options).writeFile(this.join(options, relativePath), code, {
                encoding: 'utf-8',
            });
        }

        public unlink(
            options: RequiredCompilerOptions,
            relativePath: string,
        ): Promise<void> {
            return this.fs(options).unlink(this.join(options, relativePath));
        }
    }

    export const InputDir = new IODir(true);
    export const OutputDir = new IODir(false);
}
