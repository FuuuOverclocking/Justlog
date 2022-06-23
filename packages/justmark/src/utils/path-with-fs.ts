import { FileSystem } from '../types';
import path from 'path';

export class PathWithFs {
    constructor(public readonly fs: FileSystem, public readonly str: string) {}

    public join(...paths: string[]): PathWithFs {
        return new PathWithFs(this.fs, path.join(this.str, ...paths));
    }
    public parent(): PathWithFs {
        return new PathWithFs(this.fs, path.basename(path.dirname(this.str)));
    }
    public read(): Promise<string> {
        return this.fs.promises.readFile(this.str, {
            encoding: 'utf-8',
        }) as Promise<string>;
    }
    public write(content: string): Promise<void> {
        return this.fs.promises.writeFile(this.str, content, {
            encoding: 'utf-8',
        });
    }
    public remove(): Promise<void> {
        return this.fs.promises.unlink(this.str);
    }
}
