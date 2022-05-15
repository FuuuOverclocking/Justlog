/// <reference path="../../../resources/article.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as HotReload from './hot-reload';
import { newPromise } from 'shared/build/tools';
import 'katex/dist/katex.min.css';

main();

async function main() {
    const blogLoaded = startBlogEnv();
    HotReload.startListening();

    const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
    const app = await new Promise<App>((ok) => {
        root.render(
            <React.StrictMode>
                <App callback={(app) => ok(app)} />
            </React.StrictMode>,
        );
    });

    const blog = await blogLoaded.pm;
    app.installBlog(blog);
}

function startBlogEnv() {
    const blogLoaded = newPromise<Blog>();

    globalThis.giveme = (id: string) => {
        switch (id) {
            case 'react':
                return React;
            default:
                throw new Error(`giveme("${id}") 不受支持.`);
        }
    };

    globalThis.registerBlog = (blog) => {
        blogLoaded.ok(blog);
    };

    const script = document.createElement('script');
    script.src = './blog-bundle.js';
    document.body.appendChild(script);

    return blogLoaded;
}
