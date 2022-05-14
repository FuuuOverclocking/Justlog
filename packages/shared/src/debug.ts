import chalk from 'chalk';

export enum DebugLevel {
    Info,
    Warn,
    Error,
    None = Error + 1,
}

export function debugFactory(moduleName: string) {
    const logPrefix = `[${moduleName}]: `;

    let currDebugLevel = DebugLevel.Info;

    function log(level: DebugLevel, msg: string): void {
        if (level < currDebugLevel) return;
        console.log(msg);
    }

    const debug = {
        setDebugLevel(level: DebugLevel): void {
            currDebugLevel = level;
        },
        info(msg: string) {
            msg = chalk.bold.cyan(logPrefix) + msg;
            log(DebugLevel.Info, msg);
        },
        warn(msg: string) {
            msg = chalk.bold.yellow(logPrefix) + msg;
            log(DebugLevel.Warn, msg);
        },
        error(msg: string) {
            msg = chalk.bold.red(logPrefix) + msg;
            log(DebugLevel.Error, msg);
        },
        raw: {
            info(msg: string = '') {
                log(DebugLevel.Info, msg);
            },
            warn(msg: string = '') {
                log(DebugLevel.Warn, msg);
            },
            error(msg: string = '') {
                log(DebugLevel.Error, msg);
            },
        },
        withTime: {
            info(msg: string) {
                msg =
                    chalk.grey(`[${new Date().toLocaleTimeString()}] `) +
                    chalk.bold.cyan(logPrefix) +
                    msg;
                log(DebugLevel.Info, msg);
            },
            warn(msg: string) {
                msg =
                    chalk.grey(`[${new Date().toLocaleTimeString()}] `) +
                    chalk.bold.yellow(logPrefix) +
                    msg;
                log(DebugLevel.Warn, msg);
            },
            error(msg: string) {
                msg =
                    chalk.grey(`[${new Date().toLocaleTimeString()}] `) +
                    chalk.bold.red(logPrefix) +
                    msg;
                log(DebugLevel.Error, msg);
            },
        },

        panic(msg?: string): never {
            if (msg) debug.error(msg);
            process.exit(-1);
        },
        panicIfNot(condition: boolean, msg: string): void {
            if (condition) return;
            debug.error(msg);
            process.exit(-1);
        },
        panicIf(condition: boolean, msg: string): void {
            if (!condition) return;
            debug.error(msg);
            process.exit(-1);
        },
    };

    return debug;
}
