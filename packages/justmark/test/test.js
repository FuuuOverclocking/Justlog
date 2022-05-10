const justmark = require('../build/index');

// justmark.build({
//     inputDir: './test',
//     targets: ['blog.tsx', 'blog-bundle.js', 'zhihu.md'],
//     outputDir: './test-out',
// });

justmark.watch({
    inputDir: './test',
    targets: ['blog-bundle.js', 'blog.tsx'],
    outputDir: './test-out',
});
