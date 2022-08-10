import chalk from 'chalk';
import path, { PathNice } from 'path-nice';
import fs from 'fs';
import readline from 'readline';
import shortUUID from 'short-uuid';
import { settings } from '../settings';
import { Paths } from 'shared/build/utils-nodejs';
import { log, panic } from '../utils/debug';
import { spawnSync } from 'child_process';

export function newBlog(name: string): void {
    try {
        check(name);

        const blogDir = genNewBlogDirPath(name);
        const linkPath = path(settings().blogRootDir)
            .join('writing', name)
            .separator('/');

        blogDir.ensureDirSync();
        if (!blogDir.isEmptyDirSync()) {
            panic(`目录 ${blogDir} 非空, 创建失败`);
        }

        const files = {
            'article.tsx': Paths.resources
                .join('template/article.tsx.template')
                .readFileToStringSync(),
            'article.md': Paths.resources
                .join('template/article.md.template')
                .readFileToStringSync(),
        };

        files['article.tsx'] = files['article.tsx'].replace(
            /%ARTICLE_DTS_PATH%/g,
            Paths.resources.join('article.d.ts').separator('/').raw,
        );
        files['article.md'] = files['article.md'].replace(
            /%BLOG_UUID%/g,
            shortUUID.generate(),
        );

        blogDir.join('article.tsx').writeFileSync(files['article.tsx']);
        blogDir.join('article.md').writeFileSync(files['article.md']);

        fs.symlinkSync(blogDir.raw, linkPath.raw);

        log.info(`已在目录 ${blogDir} 下创建博客模板, 并软链接至 ${linkPath}`);
        log.info(`按下按键:`);
        log.info(`    [${chalk.underline(' Enter ')}]     = 用 VS Code 打开`);
        log.info(`    [${chalk.underline(' Any other ')}] = 退出`);

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {
            if (key.name !== 'return') process.exit(0);
            spawnSync('code', [path(settings().blogRootDir).join('writing').raw], {
                shell: true,
            });
            process.exit(0);
        });
    } catch (e) {
        console.log(e);
        panic(`未能在 ${settings().blogRootDir} 下创建博客 ${name}.`);
    }
}

function genNewBlogDirPath(name: string): PathNice {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let season: '春' | '夏' | '秋' | '冬';
    if ([3, 4, 5].includes(month)) season = '春';
    if ([6, 7, 8].includes(month)) season = '夏';
    if ([9, 10, 11].includes(month)) season = '秋';
    if ([12, 1, 2].includes(month)) season = '冬';

    return path(settings().blogRootDir).join(`${year}.${season!}`, name).separator('/');
}

export function cmdDescription(): string {
    return (
        '新建一篇名为 <blog-name> 的博客. ' +
        (settings().blogRootDir
            ? `将在 ${genNewBlogDirPath('<blog-name>')} 下创建模板文件.`
            : `将在 <settings.blogRootDir>/${genNewBlogDirPath(
                  '<blog-name>',
              )} 下创建模板文件.`)
    );
}

function check(name: string): void {
    if (
        typeof name !== 'string' ||
        name.length > 255 ||
        !/^[-_0-9a-zA-Z\.]+$/.test(name)
    ) {
        panic(`${name} 不是合法的文件名.`);
    }
    if (
        name === '.justlog' ||
        /^\d{4}$/.test(name) ||
        /^\d{4}\.\d{1,2}$/.test(name) ||
        /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(name)
    ) {
        panic(`${name} 不是合法的博客名.`);
    }
}
