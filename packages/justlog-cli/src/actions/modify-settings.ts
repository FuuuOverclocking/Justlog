import { getSettings, setSettings } from '../settings';
import { JustlogSettings } from '../types';
import { panic } from '../utils/debug';

export async function modifySettings(key: string, value: string) {
    if (key === 'blogRootDir') {
        const settingsPrev: JustlogSettings = getSettings() ?? {
            blogRootDir: '',
        };
        settingsPrev.blogRootDir = value;
        setSettings(settingsPrev);

        return;
    }

    panic('未知的 key: ' + key);
}
