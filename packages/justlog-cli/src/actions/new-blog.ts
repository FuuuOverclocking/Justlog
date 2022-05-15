import readline from 'readline';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { settings } from '../settings';
import debug from '../utils/debug';
import chalk from 'chalk';
import { packagePaths, pathBackslashToSlash } from 'shared';

export function newBlog(name: string): void {
    try {
        const blogDir = pathBackslashToSlash(path.resolve(settings.blogRootDir, name));
        check(name, blogDir);

        const files = {
            'article.tsx': fs.readFileSync(
                packagePaths.join.justlog('./resources/template/article.tsx.template'),
                'utf-8',
            ),
            'article.md': fs.readFileSync(
                packagePaths.join.justlog('./resources/template/article.md.template'),
                'utf-8',
            ),
        };

        files['article.tsx'] = files['article.tsx'].replace(
            /%JUSTLOG_DIR%/g,
            packagePaths.justlog,
        );
        files['article.md'] = files['article.md'].replace(/%BLOG_UUID%/g, uuidv4());

        fs.writeFileSync(
            path.resolve(blogDir, './article.tsx'),
            files['article.tsx'],
            'utf-8',
        );
        fs.writeFileSync(
            path.resolve(blogDir, './article.md'),
            files['article.md'],
            'utf-8',
        );

        debug.info(`已在目录 ${blogDir} 下创建博客模板.`);
        debug.info(`按下按键:`);
        debug.info(
            `    [${chalk.underline(' Enter ')}]     = 用 VS Code 打开`,
        );
        debug.info(`    [${chalk.underline(' Any other ')}] = 退出`);

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {
            if (key.name !== 'return') process.exit(0);
            spawnSync('code', [blogDir], { shell: true });
            process.exit(0);
        });
    } catch (e) {
        debug.panic(`未能在 ${settings.blogRootDir} 下创建博客 ${name}.`);
    }
}

function check(name: string, blogDir: string): void {
    if (
        typeof name !== 'string' ||
        name.length > 255 ||
        !/^[-_0-9a-zA-Z\.]+$/.test(name)
    ) {
        debug.panic(`${name} 不是合法的文件名.`);
    }
    if (
        name === '.justlog' ||
        /^\d{4}$/.test(name) ||
        /^\d{4}\.\d{1,2}$/.test(name) ||
        /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(name)
    ) {
        debug.panic(`${name} 不是合法的博客名.`);
    }

    fs.ensureDirSync(blogDir);
    if (fs.readdirSync(blogDir).length !== 0) {
        debug.panic(`目录 ${blogDir} 非空, 创建失败`);
    }
}
