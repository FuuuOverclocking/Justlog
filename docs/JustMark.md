# JustMark

一个编译和打包工具.

`article.md` 是一个用扩展的 Markdown 语言编写的, 可以包含博客元信息的文档.
JustMark 从中提取元信息, 并把它编译为 jsx, 然后混入到 `article.tsx` 中.

`article.tsx` 是一个 TypeScript 模块, 它可以引用所在目录下的其他模块,
样式文件 (`.css`, `.scss`), 位图或矢量图, 普通文件 等资源. JustMark 将
使用 webpack 把它们打包和压缩, 以便博客系统引用.

### 使用方法

```ts
import { build, watch } from 'justmark';

const promise1 = build({
    inputDir: './test/input',
    targets: ['blog.tsx', 'blog-bundle', 'zhihu.md'],
    outputDir: './test/output',
});

const promise2 = watch({
    inputDir: './test/input',
    targets: ['blog-bundle', 'blog.tsx'],
    outputDir: './test/output',
});
```

在 `packages/justmark/test` 下有一个例子, 执行以下命令可测试:

```shell
cd packages/justmark
yarn test
```

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

interface CompilerOptions {
    /**
     * 输入文件夹路径. 可设置 inputFileSystem 以使用虚拟文件系统.
     */
    inputDir: string;

    /**
     * 输出文件夹路径. 可设置 outputFileSystem 以使用虚拟文件系统.
     */
    outputDir: string;

    /**
     * 构建目标列表. 列表项可以是 'blog.tsx', 'blog-bundle', 'zhihu.md'.
     */
    targets: Array<'blog.tsx' | 'blog-bundle' | 'zhihu.md'>;

    /**
     * 当构建完成后, onBuildComplete 会被调用.
     * build(..) 过程中, 它至多只被调用一次, 而 watch(..) 过程中可能被调用多次.
     */
    onBuildComplete?: null | (() => Promise<void> | void);

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    inputFileSystem?: FileSystem;

    /**
     * 可使用内存文件系统 memfs 替换默认的硬盘文件系统.
     */
    outputFileSystem?: FileSystem;

    /**
     * silent = true 时, 禁止 JustMark 输出日志.
     */
    silent?: boolean;
}
```

### JustMark 约定

`article.md`:

1. 编码, 行结束符, 缩进
    - Encoding: UTF-8
    - Indent: 4 spaces
    - Line ending: LF
2. 文件头放置博客的元数据, 语言格式为 toml:
    ````toml
    ```blog
    uuid = '%BLOG_UUID%'        # 将自动生成 uuid, 标识博客
    copyright = 'CC BY-ND 4.0'  # 博客版权声明
    topics = ['rust', 'net']    # 博客的主题, 或关键词
    lang = '简体中文'            # 还可以为 English
    bgImage = './res/bg.png'    # 封面图片
    ```
    ````
3. 第一个一级标题自动成为博客的标题
4. 可以嵌入 React 组件

    ````ts
    ```tsx embed
    <Button>按钮</Button>
    ```
    ````

    在嵌入的代码中使用的标识符, 需在 `article.tsx` 中定义.
5. 其他支持的语法
    - GitHub Favored Markdown
    - 上下标
    - 缩写
    - 脚注
    - 强调
    - latex (katex)
    - 多行表格
    - UML, mermaid 等

`article.tsx`:

```ts
// Justlog/resources/article.d.ts 是一个类型声明文件, 声明了
// `article.tsx` 下可见的类型. 不可以移除, 不可以移动位置.
/// <reference path="%JUSTLOG_DIR%/resources/article.d.ts" />

/*
 * 关于导入:
 * - 使用相对路径, 绝对路径时, 可以随意导入
 *     - 基于 webpack, 支持导入 css, scss, jpg/png/gif/bmp, ...
 * - 使用非相对导入时,
 *     - 只能使用 `import foo from '#foo';`
 *     - 不能使用 `import * as XXX from 'XXX';`
 *     - 不能使用 `import { ... } from 'XXX';`
 *     - 模块名要附加一个前缀 `#`
 *     - 只能导入有限的几个模块
 */
import React from '#react';
import { something } from './another-module';

// import React from '#react';
// 将会编译成为
// const React = giveme('react');

// 编译后将被替换成 `function blog(): Blog { return { ... }; }`
// 不可以移除, 可以移动位置.
declare function blog(): Blog;

// 向全局注册博客对象. 不可以移除, 可以移动位置.
registerBlog({
    ...blog(),
    // 在这里扩展 Blog 对象...
});
```

### 博客的元数据

除了 uuid 以外, 均为可选项.

````toml
```blog
uuid = '8c90c1d3-3afe-4404-ad2b-2f34c97e071c'
copyright = 'CC BY-ND 4.0'  # 版权信息
topics = ['rust', 'net']    # 博客的主题, 或关键词
lang = '简体中文'            # 还可以为 English
bgImage = './res/bg.png'    # 封面图片
title = '标题'              # 若指定了该项, markdown 中的第一个一级标题不会成为标题
```
````

### TODO

- Admonitions
- Code block: title, line numbers, Highlighting specific lines
- Content tabs
- ...
