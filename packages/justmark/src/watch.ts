import { CompilerOptions } from './types';
import { checkAndCompleteCompilerOptions, Rebuild } from './build-steps';
import { timeout } from 'shared';
import { log, LogLevel } from './utils/debug';

/**
 * 监视给定博客文件夹, 持续编译到给定目标, 输出到文件系统. 可使用虚拟文件系统.
 *
 * 容忍输入的博客文件的错误. 当输入文件恢复正确时, 能再次编译.
 *
 * @param options 编译选项
 * @returns 检查编译器选项后, Promise resolve; 编译器选项错误时, 终止程序.
 *          调用 stopWatch 可停止监视.
 */
export async function watch(
    options: CompilerOptions,
): Promise<{ stopWatch: () => void }> {
    if (options.silent) log.setLogLevel(LogLevel.None);

    await checkAndCompleteCompilerOptions(options);

    // rebuild 执行的规则:
    // 1. 完成了一次 rebuild 后, 才能进行下次 rebuild
    // 2. 技能 rebuild: 前摇(cast) 100ms, 冷却(cd) 900ms
    // 3. 在 cast 状态再次调用, 忽略
    // 4. 在 cd 状态再次调用, 忽略, 并在 cd 后补偿一次调用
    // 5. 虽然回到 init 状态, 但 rebuild 还未完成, 若再次调用,
    //    在构建完成后补偿一次调用
    let isBuilding = false;
    let state: 'init' | 'cast' | 'cd' = 'init';
    let shouldBuildAgain = false;

    const onSourcesChange = async (event?: 'rename' | 'change', filename?: string) => {
        // 忽略隐藏文件的改变
        if (filename && filename.startsWith('.')) return;

        if (state === 'cast') return;
        if (state === 'cd' || isBuilding) {
            shouldBuildAgain = true;
            return;
        }
        shouldBuildAgain = false;
        log.info(`文件发生变化, 正在编译...`);

        // 施法前摇...
        state = 'cast';
        await timeout(100);

        // 施法!
        await cast();
    };

    // 无前摇施法
    const cast = async () => {
        state = 'cd';
        startBuilding();
        await timeout(900);
        state = 'init';
        if (shouldBuildAgain) onSourcesChange();
    };

    const startBuilding = async () => {
        isBuilding = true;

        try {
            await Rebuild.rebuild(options as Required<CompilerOptions>);
        } catch (e) {
            log.error(e instanceof Error ? e.message : String(e));
        } finally {
            console.log(); // 打印换行符, 分隔前后行
            isBuilding = false;
            if (shouldBuildAgain) onSourcesChange();
        }
    };

    const watcher = (options.inputFileSystem! as any).watch(
        options.inputDir,
        {
            persistent: true,
            recursive: true,
            encoding: 'utf-8',
        },
        onSourcesChange,
    );

    log.info('在监视模式下开始编译...');
    cast(); // 施法, 但是不等待, 直接返回
    return {
        stopWatch(): void {
            watcher.close();
        },
    };
}
