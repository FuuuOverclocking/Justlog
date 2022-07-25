import prettier from 'prettier';
import path from 'path-nice';

const prettierrcPromise = prettier.resolveConfig(
    path.join(__dirname, 'formatter.config.toml'),
);

export async function format(source: string): Promise<{
    err: null | string;
    result: string;
}> {
    const prettierrc = await prettierrcPromise;
    if (!prettierrc) {
        return {
            err: '无法读取 justmark/.prettierrc.toml, 未执行输出文件的格式化.',
            result: source,
        };
    }

    try {
        return {
            err: null,
            result: prettier.format(source, {
                ...prettierrc,
                parser: 'typescript',
            }),
        };
    } catch (e) {
        return {
            err: 'prettier 格式化文件时发生了错误, 输出未格式化文件.',
            result: source,
        };
    }
}
