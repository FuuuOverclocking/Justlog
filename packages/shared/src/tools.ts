export function noop(): void {}

export function timeout(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function newPromise<T = void>(): {
    pm: Promise<T>;
    ok: (value: T | PromiseLike<T>) => void;
    err: (reason?: any) => void;
} {
    let ok!: (value: T | PromiseLike<T>) => void;
    let err!: (reason?: any) => void;
    const pm = new Promise<T>((resolve, reject) => {
        ok = resolve;
        err = reject;
    });
    return { pm, ok, err };
}
