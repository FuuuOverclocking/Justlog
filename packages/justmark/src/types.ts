import { Blog, BlogMeta } from 'shared';
import fs from 'fs';
import { IFs as memfs } from 'memfs';
import { PathNice } from 'path-nice';

export { Blog, BlogMeta };

export type FileSystem = typeof fs | memfs;

export const allowedTargets = ['blog-bundle', 'zhihu.md'] as const;
export type Target = typeof allowedTargets[number];

export interface CompilerOptions {
    /**
     * 输入文件夹路径. 可设置 inputFileSystem 以使用虚拟文件系统.
     */
    inputDir: string;

    /**
     * 输出文件夹路径. 可设置 outputFileSystem 以使用虚拟文件系统.
     */
    outputDir: string;

    /**
     * 构建目标列表. 列表项可以是 'blog.tsx', 'blog-bundle', 'zhihu.md'.
     */
    targets: Target[];

    /**
     * 当构建完成后, onBuildComplete 会被调用.
     * build(..) 过程中, 它至多只被调用一次, 而 watch(..) 过程中可能被调用多次.
     */
    onBuildComplete?: null | (() => Promise<void> | void);

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    inputFileSystem?: FileSystem;

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    outputFileSystem?: FileSystem;

    /**
     * silent = true 时, 禁止 JustMark 输出日志.
     */
    silent?: boolean;

    /**
     * 特定于 blogBundle 构建目标的设置.
     */
    blogBundle?: {
        /**
         * 根据输入文件夹相对于 blogRootDir 的位置, 向生成的 Blog 对象添加元数据项 path.
         *
         * addPathToMeta 为 true 时, 必须设置 blogRootDir.
         */
        addPathToMeta?: boolean;
        blogRootDir?: string;
    };
}

export interface CompilerInnerOptions {
    inputDir: PathNice;
    outputDir: PathNice;
    targets: Set<Target>;
    onBuildComplete: null | (() => Promise<void> | void);
    blogBundle?: {
        addPathToMeta?: boolean;
        blogRootDir?: string;
    };
}
