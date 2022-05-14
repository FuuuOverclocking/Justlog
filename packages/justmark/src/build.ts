import { CompilerOptions } from './types';
import debug, { DebugLevel } from './utils/debug';
import { checkAndCompleteCompilerOptions, Rebuild } from './build-steps';

/**
 * 给定博客文件夹, 编译到给定目标, 输出到文件系统, 或调用用户提供的 receiver.
 *
 * @param options 编译选项
 * @returns 编译完成时, Promise resolve(void); 发生错误时, reject(err).
 */
export async function build(options: CompilerOptions): Promise<void> {
    if (options.silent) debug.setDebugLevel(DebugLevel.None);

    await checkAndCompleteCompilerOptions(options);

    try {
        await Rebuild.rebuild(options as Required<CompilerOptions>);
    } catch (e) {
        debug.withTime.error(e instanceof Error ? e.message : String(e));
        throw e;
    }
}
