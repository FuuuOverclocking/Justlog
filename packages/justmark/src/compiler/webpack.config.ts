import path from 'path';
// import resolve from 'resolve';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
// import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const imageInlineSizeLimit = 10000;

const isDev = false;
process.env.NODE_ENV = isDev ? 'development' : 'production';

export function configFactory(options: {
    entry: string;
    inputDir: string;
    outputDir: string;
}): webpack.Configuration {
    // common function to get style loaders
    const getStyleLoaders = (cssOptions: any, preProcessor?: string) => {
        const loaders = [
            {
                loader: MiniCssExtractPlugin.loader,
                // css is located in `./`, use '../' to locate index.html folder
                // in production `paths.publicUrlOrPath` can be a relative path
                options: { publicPath: './' },
            },
            {
                loader: require.resolve('css-loader'),
                options: cssOptions,
            },
            {
                // Options for PostCSS as we reference these options twice
                // Adds vendor prefixing based on your specified browser support in
                // package.json
                loader: require.resolve('postcss-loader'),
                options: {
                    postcssOptions: {
                        // Necessary for external CSS imports to work
                        // https://github.com/facebook/create-react-app/issues/2677
                        ident: 'postcss',
                        config: false,
                        plugins: [
                            'postcss-flexbugs-fixes',
                            [
                                'postcss-preset-env',
                                {
                                    autoprefixer: {
                                        flexbox: 'no-2009',
                                    },
                                    stage: 3,
                                },
                            ],
                            // Adds PostCSS Normalize as the reset css with default options,
                            // so that it honors browserslist config in package.json
                            // which in turn let's users customize the target behavior as per their needs.
                            'postcss-normalize',
                        ],
                    },
                },
            },
        ].filter(Boolean);

        if (preProcessor) {
            loaders.push(
                {
                    loader: require.resolve('resolve-url-loader'),
                    options: {
                        root: options.inputDir,
                    },
                },
                {
                    loader: require.resolve(preProcessor),
                    options: {},
                },
            );
        }
        return loaders as any;
    };

    return {
        target: 'browserslist: >2% and since 2018 and supports es6',
        mode: isDev ? 'development' : 'production',
        bail: !isDev,
        devtool: false,
        entry: options.entry,
        output: {
            path: options.outputDir,
            pathinfo: isDev,
            filename: 'blog-bundle.js',
            chunkFilename: '[name].chunk.js',
            assetModuleFilename: 'res/[name].[hash][ext]',
            publicPath: './', // ???
        },
        optimization: {
            minimize: !isDev,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 2018,
                        compress: {
                            warnings: false,
                            inline: 2,
                        },
                        output: {
                            ecma: 2018,
                            comments: false,
                            ascii_only: true,
                        },
                    },
                }),
                new CssMinimizerPlugin(),
            ],
        },
        resolve: {
            modules: [],
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
        module: {
            rules: [
                {
                    oneOf: [
                        // TODO: Merge this config once `image/avif` is in the mime-db
                        // https://github.com/jshttp/mime-db
                        {
                            test: [/\.avif$/],
                            type: 'asset',
                            mimetype: 'image/avif',
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            type: 'asset',
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        {
                            test: /\.svg$/,
                            use: [
                                {
                                    loader: require.resolve('@svgr/webpack'),
                                    options: {
                                        prettier: false,
                                        svgo: false,
                                        svgoConfig: {
                                            plugins: [{ removeViewBox: false }],
                                        },
                                        titleProp: true,
                                        ref: true,
                                    },
                                },
                                {
                                    loader: require.resolve('file-loader'),
                                    options: {
                                        name: 'res/[name].[hash].[ext]',
                                    },
                                },
                            ],
                            issuer: {
                                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
                            },
                        },
                        // Process application JS with Babel.
                        // The preset includes JSX, Flow, TypeScript, and some ESnext features.
                        {
                            test: /\.(js|jsx|ts|tsx)$/,
                            include: options.inputDir,
                            loader: require.resolve('babel-loader'),
                            options: {
                                customize: require.resolve(
                                    'babel-preset-react-app/webpack-overrides',
                                ),
                                presets: [
                                    [
                                        require.resolve('babel-preset-react-app'),
                                        {
                                            runtime: 'classic',
                                        },
                                    ],
                                ],
                                compact: !isDev,
                            },
                        },
                        // Process any JS outside of the app with Babel.
                        // Unlike the application JS, we only compile the standard ES features.
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            loader: require.resolve('babel-loader'),
                            options: {
                                babelrc: false,
                                configFile: false,
                                compact: false,
                                presets: [
                                    [
                                        require.resolve(
                                            'babel-preset-react-app/dependencies',
                                        ),
                                        { helpers: true },
                                    ],
                                ],
                            },
                        },
                        // "postcss" loader applies autoprefixer to our CSS.
                        // "css" loader resolves paths in CSS and adds assets as dependencies.
                        // "style" loader turns CSS into JS modules that inject <style> tags.
                        // In production, we use MiniCSSExtractPlugin to extract that CSS
                        // to a file, but in development "style" loader enables hot editing
                        // of CSS.
                        // By default we support CSS Modules with the extension .module.css
                        {
                            test: /\.css$/,
                            exclude: /\.module\.css$/,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                modules: {
                                    mode: 'icss',
                                },
                            }),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // Opt-in support for SASS (using .scss or .sass extensions).
                        // By default we support SASS Modules with the
                        // extensions .module.scss or .module.sass
                        {
                            test: /\.(scss|sass)$/,
                            exclude: /\.module\.(scss|sass)$/,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    modules: {
                                        mode: 'icss',
                                    },
                                },
                                'sass-loader',
                            ),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html` and `json` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [
                                /^$/,
                                /\.(js|mjs|jsx|ts|tsx)$/,
                                /\.html$/,
                                /\.json$/,
                            ],
                            type: 'asset/resource',
                        },
                        // ** STOP ** Are you adding a new loader?
                        // Make sure to add the new loader(s) before the "file" loader.
                    ],
                },
            ],
        },
        plugins: [
            // // Inlines the webpack runtime script. This script is too small to warrant
            // // a network request.
            // // https://github.com/facebook/create-react-app/issues/5358
            // isEnvProduction &&
            //     shouldInlineRuntimeChunk &&
            //     new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),

            // // This gives some necessary context to module not found errors, such as
            // // the requesting resource.
            // new ModuleNotFoundPlugin(options.inputDir),

            // Makes some environment variables available to the JS code, for example:
            // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
            // It is absolutely essential that NODE_ENV is set to production
            // during a production build.
            // Otherwise React will be compiled in the very slow development mode.
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: isDev ? '"development"' : '"production"',
                },
            }),
            !isDev &&
                new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: 'blog-bundle.css',
                    chunkFilename: '[name].chunk.css',
                }),

            // // Generate an asset manifest file with the following content:
            // // - "files" key: Mapping of all asset filenames to their corresponding
            // //   output file so that tools can pick it up without having to parse
            // //   `index.html`
            // // - "entrypoints" key: Array of files which are included in `index.html`,
            // //   can be used to reconstruct the HTML if necessary
            // new WebpackManifestPlugin({
            //     fileName: 'asset-manifest.json',
            //     publicPath: paths.publicUrlOrPath,
            //     generate: (seed, files, entrypoints) => {
            //         const manifestFiles = files.reduce((manifest, file) => {
            //             manifest[file.name] = file.path;
            //             return manifest;
            //         }, seed);
            //         const entrypointFiles = entrypoints.main.filter(
            //             (fileName) => !fileName.endsWith('.map'),
            //         );

            //         return {
            //             files: manifestFiles,
            //             entrypoints: entrypointFiles,
            //         };
            //     },
            // }),

            // // Moment.js is an extremely popular library that bundles large locale files
            // // by default due to how webpack interprets its code. This is a practical
            // // solution that requires the user to opt into importing specific locales.
            // // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
            // // You can remove this if you don't use Moment.js:
            // new webpack.IgnorePlugin({
            //     resourceRegExp: /^\.\/locale$/,
            //     contextRegExp: /moment$/,
            // }),

            // // TypeScript type checking
            // new ForkTsCheckerWebpackPlugin({
            //     async: isDev,
            //     typescript: {
            //         typescriptPath: resolve.sync('typescript', {
            //             // basedir: path.resolve(__dirname, '../../../../node_modules'),
            //         }),
            //         configOverwrite: {
            //             compilerOptions: {
            //                 sourceMap: false,
            //                 skipLibCheck: true,
            //                 inlineSourceMap: false,
            //                 declarationMap: false,
            //                 noEmit: true,
            //             },
            //         },
            //         context: paths.appPath,
            //         diagnosticOptions: {
            //             syntactic: true,
            //         },
            //         mode: 'write-references',
            //         // profile: true,
            //     },
            //     issue: {
            //         // This one is specifically to match during CI tests,
            //         // as micromatch doesn't match
            //         // '../cra-template-typescript/template/src/App.tsx'
            //         // otherwise.
            //         include: [
            //             { file: '../**/src/**/*.{ts,tsx}' },
            //             { file: '**/src/**/*.{ts,tsx}' },
            //         ],
            //         exclude: [
            //             { file: '**/src/**/__tests__/**' },
            //             { file: '**/src/**/?(*.){spec|test}.*' },
            //             { file: '**/src/setupProxy.*' },
            //             { file: '**/src/setupTests.*' },
            //         ],
            //     },
            //     logger: {
            //         infrastructure: 'silent',
            //     },
            // }),
        ],
    };
}
