/// <reference path="D:/dev/env/justlog/resources/article.d.ts" />

import React from '#react';
import { bar } from './test-import';
import './test-css.css';
import './test-scss.scss';
import imageSrc from './test-image.jpg';

const Button: React.FunctionComponent<{ children: React.ReactNode }> = (props) => {
    return <button>{props.children}</button>;
};

console.log(bar);
console.log(imageSrc);

declare function blog(): Blog;
registerBlog({
    ...blog(),
    // 在这里扩展 Blog 对象...
});
