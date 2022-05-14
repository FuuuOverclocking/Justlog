/// <reference path="../../../resources/article.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as HotReload from './hot-reload';
import { newPromise } from 'shared';
import 'katex/dist/katex.min.css';

window.giveme = (id: string) => {
    switch (id) {
        case 'react':
            return React;
        default:
            throw new Error(`giveme("${id}") 不受支持.`);
    }
};

window.registerBlog = (blog) => {
    blogLoaded.ok(blog);
};

main();

const appLoaded = newPromise();
const blogLoaded = newPromise<Blog>();
async function main() {
    const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
    const app = await new Promise<App>((ok) => {
        root.render(
            <React.StrictMode>
                <App callback={(app) => ok(app)} />
            </React.StrictMode>,
        );
    });
    appLoaded.ok();

    document.body.appendChild((() => {
        const script = document.createElement('script');
        script.src = './blog-bundle.js';
        return script;
    })());

    Promise.all([appLoaded.pm, blogLoaded.pm]).then((args) => {
        app.installBlog(args[1]);
    });

    HotReload.startListening();
}
