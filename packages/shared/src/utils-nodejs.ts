import path from 'path';
import fs from 'fs-extra';

export function pathBackslashToSlash(s: string): string {
    return s.replace(/\\/g, '/');
}

export class Path {
    public readonly str: string;
    constructor(str: string) {
        this.str = pathBackslashToSlash(str);
    }
    public join(...paths: string[]): Path {
        return new Path(path.join(this.str, ...paths));
    }
    public parent(): Path {
        return new Path(path.basename(path.dirname(this.str)));
    }

    public readFile(): Promise<string> {
        return fs.readFile(this.str, { encoding: 'utf-8' });
    }
    public readJson(): Promise<any> {
        return fs.readJson(this.str, { encoding: 'utf-8' });
    }
    public writeFile(content: string): Promise<void> {
        return fs.writeFile(this.str, content, { encoding: 'utf-8' });
    }
    public writeJson(
        content: string,
        options?: {
            replacer?: any;
            spaces?: number | string | undefined;
            EOL?: string | undefined;
        },
    ): Promise<void> {
        options ??= {};
        return fs.writeJson(this.str, content, { encoding: 'utf-8', ...options });
    }

    public exists(): Promise<boolean> {
        return fs.pathExists(this.str);
    }
    public copyTo(dest: string | Path): Promise<void> {
        return fs.copy(this.str, dest instanceof Path ? dest.str : dest);
    }
    public moveTo(dest: string | Path): Promise<void> {
        return fs.move(this.str, dest instanceof Path ? dest.str : dest);
    }
    public remove(): Promise<void> {
        return fs.remove(this.str);
    }

    public emptyDir(): Promise<void> {
        return fs.emptyDir(this.str);
    }
    public ensureDir(): Promise<void> {
        return fs.ensureDir(this.str);
    }
    public ensureFile(): Promise<void> {
        return fs.ensureFile(this.str);
    }
}

export namespace Paths {
    export const root = new Path(path.resolve(__dirname, '../../../'));
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
