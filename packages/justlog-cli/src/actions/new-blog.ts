import shortUUID from 'short-uuid';
import { settings } from '../settings';
import chalk from 'chalk';
import { Paths } from 'shared/build/utils-nodejs';
import { log, panic } from '../utils/debug';
import readline from 'readline';
import { spawnSync } from 'child_process';
import path, { PathNice } from 'path-nice';

export function newBlog(name: string): void {
    try {
        const blogDirPath = path(settings().blogRootDir).join(name);
        check(name, blogDirPath);

        const files = {
            'article.tsx': Paths.resources
                .join('template/article.tsx.template')
                .readFileToStringSync(),
            'article.md': Paths.resources
                .join('template/article.md.template')
                .readFileToStringSync(),
        };

        files['article.tsx'] = files['article.tsx'].replace(
            /%JUSTLOG_DIR%/g,
            Paths.root.raw,
        );
        files['article.md'] = files['article.md'].replace(
            /%BLOG_UUID%/g,
            shortUUID.generate(),
        );

        blogDirPath.join('article.tsx').writeFileSync(files['article.tsx']);
        blogDirPath.join('article.md').writeFileSync(files['article.md']);

        log.info(`已在目录 ${blogDirPath} 下创建博客模板.`);
        log.info(`按下按键:`);
        log.info(`    [${chalk.underline(' Enter ')}]     = 用 VS Code 打开`);
        log.info(`    [${chalk.underline(' Any other ')}] = 退出`);

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {
            if (key.name !== 'return') process.exit(0);
            spawnSync('code', [blogDirPath.raw], { shell: true });
            process.exit(0);
        });
    } catch (e) {
        panic(`未能在 ${settings().blogRootDir} 下创建博客 ${name}.`);
    }
}

function check(name: string, blogDir: PathNice): void {
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

    blogDir.ensureDirSync();
    if (!blogDir.isEmptyDirSync()) {
        panic(`目录 ${blogDir} 非空, 创建失败`);
    }
}
