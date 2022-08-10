import path, { PathNice } from 'path-nice';
import * as justmark from 'justmark';
import { Paths } from 'shared/build/utils-nodejs';
import { settings } from '../settings';
import { panic } from '../utils/debug';

export async function buildBlog(): Promise<void> {
    const realCwd = await path(process.cwd()).realpath();
    const realBlogRootDir = await path(settings().blogRootDir).realpath();
    const relativePath = realCwd.toRelative(realBlogRootDir).separator('/');
    
    check(realCwd, realBlogRootDir);
    await justmark.build({
        inputDir: realCwd.raw,
        outputDir: Paths.data.join('built-blogs').join(relativePath).raw,
        targets: ['blog-bundle'],
    });
}

async function check(realCwd: PathNice, realBlogRootDir: PathNice) {
    const relativePath = realCwd.toRelative(realBlogRootDir).separator('/');
    if (!/^\d{4}\.[春夏秋冬]$/.test(relativePath.raw.split('/')[0])) {
        panic('当前目录不是一个博客目录.');
    }
    if (
        !(await realCwd.join('article.md').isFile()) ||
        !(await realCwd.join('article.tsx').isFile())
    ) {
        panic('当前目录不是一个博客目录.');
    }
}
