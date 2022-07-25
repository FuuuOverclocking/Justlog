const justmark = require('../build/index');

// justmark.build({
//     inputDir: './test/input',
//     targets: ['blog-bundle', 'zhihu.md'],
//     outputDir: './test/output',
// });

justmark.watch({
    inputDir: './test/input',
    targets: ['blog-bundle'],
    outputDir: './test/output',
});
