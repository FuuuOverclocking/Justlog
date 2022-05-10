import fs from 'fs-extra';
import path from 'path';
import { justlogDir } from './paths';
import { JustlogSettings } from './types';

const settingJsonPath = path.resolve(justlogDir, './settings/settings.json');
let _settings = null as null | JustlogSettings;

export function getSettings(): null | JustlogSettings {
    if (_settings) return _settings;

    try {
        _settings = fs.readJSONSync(settingJsonPath);
        return _settings;
    } catch (e) {
        return null;
    }
}

export function setSettings(s: JustlogSettings): void {
    _settings = s;

    fs.writeJSONSync(settingJsonPath, s, {
        spaces: 4,
    });
}

export const settings = {
    get blogRootDir() {
        const s = getSettings();
        return s ? s.blogRootDir : '';
    },
};
