import { Blog, BlogMeta } from 'shared';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { IFs } from 'memfs';

export { Blog, BlogMeta };

export type Target = 'blog.tsx' | 'blog-bundle.js' | 'zhihu.md';

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
     * 构建目标列表. 列表项可以是 'blog.tsx', 'blog-bundle.js', 'zhihu.md'.
     */
    targets: Target[];

    /**
     * 当构建完成后, onBuildComplete 会被调用.
     * build(..) 过程中, 它至多只被调用一次, 而 watch(..) 过程中可能被调用多次.
     */
    onBuildComplete?: () => void;

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    inputFileSystem?: FileSystem;

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    outputFileSystem?: FileSystem;

    /**
     * silent = true 时, 禁止 JustMark 在 stdout.
     */
    silent?: boolean;
}

export type FileSystem = typeof fs | typeof fsExtra | IFs;
