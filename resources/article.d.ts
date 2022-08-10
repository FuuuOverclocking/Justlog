/// <reference path="./env.d.ts" />

import * as shared from 'shared';

declare global {
    /**
     * @internal
     *
     * Note: 仅供 JustMark 编译器内部使用.
     *
     * 导入一个模块, 类似于 CommonJS 的 require() 函数.
     *
     * 诸如 `import React from '#react';`, 在经过 JustMark 编译后,
     * 会转译为 `const React = giveme('react');`.
     */
    function giveme(id: string): any;

    interface Window {
        blogs: Blog[];
    }

    namespace JSX {
        interface IntrinsicElements {
            [tagName: string]: any;
        }
    }

    interface Blog extends shared.Blog {}
}

