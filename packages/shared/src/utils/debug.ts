import chalk from 'chalk';

export enum LogLevel {
    Info,
    Warn,
    Error,
    None = Error + 1,
}

export class Log {
    private logLevel: LogLevel;
    private readonly moduleName: string;
    private readonly _withTime: boolean;
    private readonly _withModuleName: boolean;

    private readonly levelInfoModuleName: string;
    private readonly levelWarnModuleName: string;
    private readonly levelErrorModuleName: string;

    constructor(options: {
        moduleName: string;
        logLevel: LogLevel;
        withTime?: boolean;
        withModuleName?: boolean;
    }) {
        options.withTime ??= false;
        options.withModuleName ??= false;
        this.logLevel = options.logLevel;
        this.moduleName = options.moduleName;
        this._withTime = options.withTime;
        this._withModuleName = options.withModuleName;

        if (this._withModuleName) {
            this.levelInfoModuleName = chalk.bold.cyan(`[${this.moduleName}]`);
            this.levelWarnModuleName = chalk.bold.yellow(`[${this.moduleName}]`);
            this.levelErrorModuleName = chalk.bold.red(`[${this.moduleName}]`);
        } else {
            this.levelInfoModuleName = '';
            this.levelWarnModuleName = '';
            this.levelErrorModuleName = '';
        }
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private log(level: LogLevel, msg?: string): void {
        if (level < this.logLevel) return;

        let str = this._withTime
            ? chalk.grey(`[${new Date().toLocaleTimeString()}]`)
            : '';
        if (this._withModuleName) {
            switch (level) {
                case LogLevel.Info:
                    str += this.levelInfoModuleName;
                    break;
                case LogLevel.Warn:
                    str += this.levelWarnModuleName;
                    break;
                case LogLevel.Error:
                    str += this.levelErrorModuleName;
                    break;
            }
        }
        if (this._withTime || this._withModuleName) {
            str += ': '
        }
        str += msg;
        console.log(str);
    }

    public info(msg?: string): void {
        this.log(LogLevel.Info, msg);
    }
    public warn(msg?: string): void {
        this.log(LogLevel.Warn, msg);
    }
    public error(msg?: string): void {
        this.log(LogLevel.Error, msg);
    }

    public get raw(): Log {
        let value = new Log({ moduleName: this.moduleName, logLevel: this.logLevel });
        Object.defineProperty(this, 'raw', { value });
        return value;
    }
    public get withTime(): Log {
        let value = new Log({
            moduleName: this.moduleName,
            logLevel: this.logLevel,
            withTime: true,
            withModuleName: this._withModuleName,
        });
        Object.defineProperty(this, 'withTime', { value });
        return value;
    }
    public get withModuleName(): Log {
        let value = new Log({
            moduleName: this.moduleName,
            logLevel: this.logLevel,
            withTime: this._withTime,
            withModuleName: true,
        });
        Object.defineProperty(this, 'withModuleName', { value });
        return value;
    }
}

export function assertFactory(moduleName: string) {
    function panic(msg?: string): never {
        let str = chalk.grey(`[${new Date().toLocaleTimeString()}]`);
        str += chalk.bold.red(`[${moduleName}]`) + ': ';
        str += chalk.bgRed(' Panic! ') + ' ';
        if (msg) str += msg;
        console.log(str);

        printStack();
        if (typeof process !== 'undefined') process.exit(-1);
        throw 'panicked';
    }

    function assert(condition: boolean, msg?: string): void {
        if (condition) return;

        let str = chalk.grey(`[${new Date().toLocaleTimeString()}]`);
        str += chalk.bold.red(`[${moduleName}]`) + ': ';
        str += chalk.bgRed(' 断言失败! ') + ' ';
        if (msg) str += msg;
        console.log(str);

        printStack();
        if (typeof process !== 'undefined') process.exit(-1);
    }

    return {
        panic,
        assert,
    };

    function printStack(): void {
        const stack = new Error().stack;
        if (stack) {
            console.log(
                stack
                    .split('\n')
                    // 丢弃前 3 行. 第一行: Error. 第二行: printStack().
                    // 第三行: panic() 或 assert().
                    .splice(3)
                    .join('\n'),
            );
        }
    }
}
