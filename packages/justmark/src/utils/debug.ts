import { Log, assertFactory, LogLevel } from 'shared';
export { LogLevel };

export const log = new Log({
    moduleName: 'justmark',
    logLevel: LogLevel.Info,
    withModuleName: true,
    withTime: true,
});

const _ = assertFactory('justmark');
export const assert = _.assert;
export const panic = _.panic;
