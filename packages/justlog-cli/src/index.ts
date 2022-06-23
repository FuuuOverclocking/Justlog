#!/usr/bin/env node

import { program } from 'commander';
import { checkSettings, settings } from './settings';
import { newBlog } from './actions/new-blog';
import { buildBlog } from './actions/build-blog';
import { viewBlog } from './actions/view-blog';
import { publishBlog } from './actions/publish-blog';
import { modifySettings } from './actions/modify-settings';

program.name('justlog').version('0.1.0');

program
    .command('new <blog-name>')
    .description(
        '新建一篇名为 <blog-name> 的博客. ' +
            (settings().blogRootDir
                ? `将在 ${settings().blogRootDir}/<blog-name> 下创建模板文件.`
                : `将在 <settings.blogRootDir>/<blog-name> 下创建模板文件.`),
    )
    .action((blogName: string) => newBlog(blogName));

program
    .command('build')
    .description(`构建博客.`)
    .action(() => buildBlog());

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
