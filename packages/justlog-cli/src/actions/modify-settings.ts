import { getSettings, setSettings } from '../settings';
import { JustlogSettings } from '../types';
import debug from '../utils/debug';

export async function modifySettings(key: string, value: string) {
    if (key === 'blogRootDir') {
        const settingsPrev: JustlogSettings = getSettings() ?? {
            blogRootDir: '',
        };
        settingsPrev.blogRootDir = value;
        setSettings(settingsPrev);

        return;
    }

    debug.panic('未知的 key: ' + key);
}
