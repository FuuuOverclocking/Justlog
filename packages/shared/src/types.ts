import React from 'react';

export interface Blog extends BlogMeta {
    content: React.ReactNode;
}

export interface BlogMeta {
    uuid: string;
    title: string;
    copyright?: string;
    topics?: string[];
    lang?: '简体中文' | 'English';
    bgImage?: string;
}
