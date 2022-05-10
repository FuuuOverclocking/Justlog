# Justlog

```shell
git clone git@github.com:FuuuOverclocking/Justlog.git
yarn
yarn link
```

## License

MIT

## Justlog-CLI

```shell
justlog help
```

## JustMark

### 使用方法

```ts
import { build, watch } from 'justmark';

build({
    blogDir: '../blogs/it-s-a-good-day',
    targets: ['blog.tsx'],
    outputTo: 'fs',
    outputDir: '/path/to/result',
}).then(() => {
    // ...
});
```

在 `./test` 下有一个用例.

### API

```ts
/**
 * 给定博客文件夹, 编译到给定目标, 输出到文件系统, 或调用用户提供的 receiver.
 *  
 * @param options 编译选项
 * @returns 编译完成时, Promise resolve(void); 发生错误时, reject(err).
 */
async function build(options: CompilerOptions): Promise<void>;

/**
 * 监视给定博客文件夹, 持续编译到给定目标, 输出到文件系统, 或调用用户提供的 receiver.
 *
 * 容忍输入的博客文件的错误. 当输入文件恢复正确时, 能再次编译.
 *
 * @param options 编译选项
 * @returns 检查编译器选项后, Promise resolve; 编译器选项错误时, 终止程序.
 *          调用 stopWatch 可停止监视.
 */
async function watch(
    options: CompilerOptions,
): Promise<{ stopWatch: () => void }>;

type CompilerOptions = {
    /** 输入的博客文件夹. */
    blogDir: string;
    /** 编译目标. */
    targets: Array<'blog.tsx' | 'blog-bundle.js' | 'zhihu.md'>;
    /** silent = true 时, 禁止在终端打印各种信息. */
    silent?: boolean;
} & OutputOptions;

type OutputOptions = 
    | { outputTo: 'fs'; outputDir: string; }
    | { outputTo: 'receiver'; receiver: (results: CompilationResult) => void; };

type CompilationResult = {
    "blog.tsx"?: string;
    "blog-bundle.js"?: string;
    "zhihu.md"?: string;
}
```

### JustMark 约定

`article.md`:

1. 编码, 行结束符, 缩进
    - Encoding: UTF-8
    - Indent: 4 spaces
    - Line ending: LF
2. 文件头可放置博客的元数据, 语言格式为 toml:
    ````toml
    ```blog
    copyright = 'CC BY-ND 4.0'
    topics = ['rust', 'net']    # 博客的主题, 或关键词
    lang = '简体中文'           # 还可以为 English
    bgImage = './res/bg.png'    # 封面图片
    ```
    ````
3. 第一个一级标题自动成为博客的标题
4. 可以嵌入 React 组件

    ````ts
    ```tsx embed
    <Button />
    ```
    ````

    在嵌入的代码中使用的标识符, 需在 `article.tsx` 中定义.
5. 支持的语法
    - GitHub Favored Markdown
    - 上下标
    - 缩写
    - 脚注
    - 强调
    - latex
    - 多行表格
    - UML, mermaid 等

`article.tsx`:

1. 文件头的指令 `/// <reference path="../lib/article.d.ts" />`
    - 包含了一个类型声明文件, 声明了 `article.tsx` 下可见的类型
    - 不可以移除, 不可以移动位置
2. `declare function blog(): Blog;`
    - 编译后将被替换成 `function blog(): Blog { return { ... }; }`
    - 不可以移除
3. `function extendBlog(): Partial<Blog> { return {}; }`
    - 将被调用一次, 将返回值附加到 blog 对象上
    - 可以自行修改
4. 可以使用 `import` 语句
    - 使用相对路径, 绝对路径时, 可以随意导入
        - 基于 webpack, 支持导入 css, scss, jpg/png/gif/bmp, ...
    - 使用非相对导入时, 只能支持下面一种格式

        - 不能使用 `import * as XXX from 'XXX';`
        - 不能使用 `import { ... } from 'XXX';`
        - 模块名要附加一个前缀 `#`
        - 只能导入有限的几个模块

        例如:
        ```ts
        import React from '#react';
        import chalk from '#chalk';
        // ...
        ```

        将编译为
        ```ts
        const React = order('react');
        const chalk = order('chalk');
        // ...
        ```

### 博客的元数据

均为可选项.

````toml
```blog
copyright = 'CC BY-ND 4.0'  # 版权信息
topics = ['rust', 'net']    # 博客的主题, 或关键词
lang = '简体中文'           # 还可以为 English
bgImage = './res/bg.png'    # 封面图片
title = '标题'              # 若指定了该项, markdown 中的第一个一级标题不会成为标题
```
````

### TODO

- Admonitions
- Code block: title, line numbers, Highlighting specific lines
- Content tabs
- flow chart
- 