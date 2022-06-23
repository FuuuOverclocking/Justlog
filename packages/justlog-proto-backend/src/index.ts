import Koa from 'koa';
import serve from 'koa-static';
import ws from 'ws';
import fs from 'fs-extra';
import * as justmark from 'justmark';
import { Paths } from 'shared/utils-nodejs';

const app = new Koa();

app.use(serve(Paths.packages.justlogProto.join('./build').str, {}));

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
        fs.copySync(
            Paths.packages.justlogProtoBackend.join('output/blog-bundle').str,
            Paths.packages.justlogProto.join('build').str,
        );
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
