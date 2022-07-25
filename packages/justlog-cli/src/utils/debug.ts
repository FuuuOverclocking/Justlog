import { Log, assertFactory, LogLevel } from 'shared';

export const log = new Log({
    moduleName: 'justlog-cli',
    logLevel: LogLevel.Info,
    withModuleName: true,
    withTime: true,
});

const _ = assertFactory('justlog-cli');
export const assert = _.assert;
export const panic = _.panic;
