const justmark = require('../build/index');

// justmark.build({
//     inputDir: './test/input',
//     targets: ['blog.tsx', 'blog-bundle.js', 'zhihu.md'],
//     outputDir: './test/output',
// });

justmark.watch({
    inputDir: './test/input',
    targets: ['blog-bundle.js', 'blog.tsx'],
    outputDir: './test/output',
});
