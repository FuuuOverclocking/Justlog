import path from 'path-nice';

export namespace Paths {
    export const root = path(__dirname).join('../../../');
    export const packages = {
        justlogCli: root.join('packages/justlog-cli'),
        justlogProto: root.join('packages/justlog-proto'),
        justlogProtoBackend: root.join('packages/justlog-proto-backend'),
        justmark: root.join('packages/justmark'),
        shared: root.join('packages/shared'),
    };
    export const data = root.join('data');
    export const resources = root.join('resources');
}
