import Koa from 'koa';
import serve from 'koa-static';
import ws from 'ws';
import fs from 'fs-extra';
import * as justmark from 'justmark';
import { Paths } from 'shared/build/utils-nodejs';

const app = new Koa();

app.use(serve(Paths.packages.justlogProto.join('./build').raw, {}));

const server = app.listen(80);
const wss = new ws.Server({ server, clientTracking: true });

interface WSMessage {
    channel: string;
    message: any;
}
wss.on('connection', function connection(ws) {
    // ws.on('message', function incoming(msgBuffer) {
    //     const msg = JSON.parse(msgBuffer.toString('utf-8')) as WSMessage;
    // });
});

justmark.watch({
    inputDir: './input',
    outputDir: './output',
    targets: ['blog-bundle'],
    onBuildComplete() {
        const pathBlogBundle = Paths.packages.justlogProtoBackend.join('output/blog-bundle');
        const pathBuild = Paths.packages.justlogProto.join('build');
        pathBlogBundle.copySync(pathBuild);

        wss.clients.forEach((ws) => {
            ws.send(
                JSON.stringify({
                    channel: 'blog-bundle',
                    message: 'updated',
                }),
            );
        });
    },
});
