import path, { PathNice } from 'path-nice';
import * as justmark from 'justmark';
import { Paths } from 'shared/build/utils-nodejs';
import { settings } from '../settings';
import { panic } from '../utils/debug';

export async function buildBlog(blogDir?: string): Promise<void> {
    const realBlogDir = await path(blogDir ?? process.cwd()).realpath();
    const realBlogRootDir = await path(settings().blogRootDir).realpath();
    const relativePath = realBlogDir.toRelative(realBlogRootDir).separator('/');
    
    check(realBlogDir, realBlogRootDir, relativePath);

    await justmark.build({
        inputDir: realBlogDir.raw,
        outputDir: Paths.data.join('built-blogs').join(relativePath).raw,
        targets: ['blog-bundle'],
        blogBundle: {
            addPathToMeta: true,
            blogRootDir: settings().blogRootDir,
        }
    });
}

async function check(realBlogDir: PathNice, realBlogRootDir: PathNice, relativePath: PathNice) {
    if (!/^\d{4}\.[春夏秋冬]$/.test(relativePath.raw.split('/')[0])) {
        panic('当前目录不是一个博客目录.');
    }
    if (
        !(await realBlogDir.join('article.md').isFile()) ||
        !(await realBlogDir.join('article.tsx').isFile())
    ) {
        panic('当前目录不是一个博客目录.');
    }
}
