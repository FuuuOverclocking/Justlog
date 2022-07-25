import chalk from 'chalk';
import { Paths } from 'shared/build/utils-nodejs';
import { JustlogSettings } from './types';
import { panic } from './utils/debug';

const settingsPath = Paths.data.join('settings.json');

let _settings = null as null | JustlogSettings;

/**
 * 获取位于 <root>/data/settings.json 的配置.
 * 若已读取到内存, 直接返回缓存, 否则读取并缓存.
 * 若文件不存在, 创建并写入默认配置.
 */
export function settings(): JustlogSettings {
    if (_settings) return _settings;

    try {
        _settings = settingsPath.readJSONSync();
        return _settings!;
    } catch (e) {
        try {
            _settings = generateDefaultSettings();
            settingsPath.ensureFileSync();
            settingsPath.writeJSONSync(_settings);
            return _settings;
        } catch (e) {
            return panic(`无法向 ${settingsPath.raw} 写入设置.`);
        }
    }
}

function generateDefaultSettings(): JustlogSettings {
    return {
        blogRootDir: '',
    };
}

export function updateSettings(fn: (s: JustlogSettings) => void): void {
    fn(settings());
    settingsPath.writeJSONSync(settings());
}

export function checkSettings(): {
    problems: string[];
    summary(): string;
} {
    const problems = [] as string[];
    if (!settings().blogRootDir) {
        problems.push(
            `settings.blogRootDir (博客根文件夹) 仍未设置. 运行 ${chalk.bgBlue.white(
                'justlog set blogRootDir "X:/path/to/blogs"',
            )} 以设置.`,
        );
    }

    return {
        problems,
        summary() {
            return (
                '当前设置存在问题:\n' + problems.map((str) => '  ❌ ' + str).join('\n')
            );
        },
    };
}
