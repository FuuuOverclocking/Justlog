import path from 'path';

export const justlogDir = pathBackslashToSlash(path.resolve(__dirname, '../../../'));
export const justlogCliDir = pathBackslashToSlash(path.resolve(__dirname, '../'));

function pathBackslashToSlash(s: string): string {
    return s.replace(/\\/g, '/');
}