import { Log, assertFactory, LogLevel } from 'shared/utils';
export { LogLevel };

export const log = new Log({
    moduleName: 'justlog-cli',
    logLevel: LogLevel.Info,
    withModuleName: true,
    withTime: true,
});

const _ = assertFactory('justmark');
export const assert = _.assert;
export const panic = _.panic;
