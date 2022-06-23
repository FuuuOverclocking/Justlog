import { updateSettings } from '../settings';
import { panic } from '../utils/debug';

export async function modifySettings(key: string, value: string) {
    if (key === 'blogRootDir') {
        updateSettings((s) => {
            s.blogRootDir = value;
        });
        return;
    }

    panic('未知的 key: ' + key);
}
