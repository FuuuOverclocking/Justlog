/// <reference path="D:/dev/env/justlog/resources/article.d.ts" />

import React from '#react';
import './frame.scss';

declare function blog(): Blog;
registerBlog({
    ...blog(),
    // 在这里扩展 Blog 对象...
});
