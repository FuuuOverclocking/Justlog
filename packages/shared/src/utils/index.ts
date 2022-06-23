export * from './debug';

export function noop(): void {}

export function timeout(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export type $Promise<T> = Promise<T> & {
    ok: (value: T | PromiseLike<T>) => void;
    err: (reason?: any) => void;
};
export function $Promise<T = void>(): $Promise<T> {
    let ok!: (value: T | PromiseLike<T>) => void;
    let err!: (reason?: any) => void;
    const pm = new Promise<T>((resolve, reject) => {
        ok = resolve;
        err = reject;
    }) as $Promise<T>;
    pm.ok = ok;
    pm.err = err;
    return pm;
}

export function objectMap<T, V>(
    obj: T,
    fn: (value: T[keyof T], key: keyof T, obj: T) => V,
): { [k in keyof T]: V } {
    const result: any = {};
    for (const key of Object.keys(obj) as Array<keyof T>) {
        result[key] = fn(obj[key], key, obj);
    }
    return result;
}
