import { checkAndGetInnerOptions, compile } from './compiler/compile';
import { CompilerOptions } from './types';
import { log, LogLevel } from './utils/debug';

/**
 * 给定博客文件夹, 编译到给定目标, 输出到文件系统. 可使用虚拟文件系统.
 *
 * @param options 编译选项
 * @returns 编译完成时, Promise resolve(void); 发生错误时, reject(err).
 */
export async function build(options: CompilerOptions): Promise<void> {
    if (options.silent) log.setLogLevel(LogLevel.None);

    const opts = checkAndGetInnerOptions(options);

    try {
        await compile(opts);
    } catch (e) {
        if (e instanceof Error) {
            log.error(e.message);
            log.error(e.stack);
        } else {
            log.error(String(e));
        }

        throw e;
    }
}
