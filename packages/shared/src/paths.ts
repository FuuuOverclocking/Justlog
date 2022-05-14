import path from 'path';

export function pathBackslashToSlash(s: string): string {
    return s.replace(/\\/g, '/');
}

const _packagePaths = {
    justlog: pathBackslashToSlash(path.resolve(__dirname, '../../../')),
    justlogCli: pathBackslashToSlash(path.resolve(__dirname, '../../justlog-cli')),
    justlogProto: pathBackslashToSlash(path.resolve(__dirname, '../../justlog-proto')),
    justlogProtoBackend: pathBackslashToSlash(
        path.resolve(__dirname, '../../justlog-proto-backend'),
    ),
    justmark: pathBackslashToSlash(path.resolve(__dirname, '../../justmark')),
    shared: pathBackslashToSlash(path.resolve(__dirname, '../../shared')),
};

type PackageName = keyof typeof _packagePaths;

export const packagePaths = {
    ..._packagePaths,
    join: Object.keys(_packagePaths).reduce(
        (result, key) => {
            result[key as PackageName] = (...pathSegments: string[]) =>
                pathBackslashToSlash(
                    path.resolve(_packagePaths[key as PackageName], ...pathSegments),
                );
            return result;
        },
        {} as {
            [_ in PackageName]: (...pathSegments: string[]) => string;
        },
    ),
};
