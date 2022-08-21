#!/usr/bin/env node

import { program } from 'commander';
import path from 'path-nice';
import { checkSettings } from './settings';
import { newBlog, cmdDescription } from './actions/new-blog';
import { buildBlog } from './actions/build-blog';
import { viewBlog } from './actions/view-blog';
import { publishBlog } from './actions/publish-blog';
import { modifySettings } from './actions/modify-settings';

const packageJson = path(__dirname).join('../package.json').readJSONSync();
program.name('justlog').version(packageJson.version);

program
    .command('new <blog-name>')
    .description(cmdDescription())
    .action((blogName: string) => newBlog(blogName));

program
    .command('build [blog-dir]')
    .description(`构建博客. blog-dir 默认为当前工作目录.`)
    .action((blogDir) => buildBlog(blogDir));

program
    .command('view')
    .description(`实时预览博客.`)
    .action(() => viewBlog());

program
    .command('publish')
    .description(`发布博客.`)
    .action(() => publishBlog());

program
    .command('set <key> <value>')
    .description(`更改 justlog 的设置.`)
    .action((key: string, value: string) => modifySettings(key, value));

const checkResult = checkSettings();
if (checkResult.problems.length) {
    program.addHelpText('after', '\n\n' + checkResult.summary());
}

program.parse();
