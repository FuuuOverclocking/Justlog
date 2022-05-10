#!/usr/bin/env node

import { program } from 'commander';
import { getSettings, settings } from './settings';
import { panic } from './utils/debug';
import chalk from 'chalk';

import { newBlog } from './actions/new-blog';
import { buildBlog } from './actions/build-blog';
import { viewBlog } from './actions/view-blog';
import { publishBlog } from './actions/publish-blog';
import { modifySettings } from './actions/modify-settings';

program.name('justlog').version('0.1.0');

program
    .command('new <blog-name>')
    .description(
        `新建一篇名为 <blog-name> 的博客. 将在 ${settings.blogRootDir}/<blog-name> 下创建模板文件.`,
    )
    .action((blogName: string) => checkSettings() && newBlog(blogName));

program
    .command('build')
    .description(`构建博客.`)
    .action(() => checkSettings() && buildBlog());

program
    .command('view')
    .description(`实时预览博客.`)
    .action(() => checkSettings() && viewBlog());

program
    .command('publish')
    .description(`发布博客.`)
    .action(() => checkSettings() && publishBlog());

program
    .command('set <key> <value>')
    .description(`更改 justlog 的设置.`)
    .action((key: string, value: string) => modifySettings(key, value));

program.parse();

function checkSettings(): true {
    if (getSettings()) return true;

    // prettier-ignore
    panic(
        `需先设置 博客根文件夹 以继续. 运行 ${
            chalk.bgBlue.white('justlog set blogRootDir "X:/path/to/blogs"')
        } 以设置.`,
    );
}
