import MarkdownIt from 'markdown-it';
import Toml from 'toml';
import { RenderInfo } from './compiler-types';

export interface JustMarkPluginOptions {
    renderInfo: Partial<RenderInfo>;
}

export function justmarkPlugin(md: MarkdownIt, options: JustMarkPluginOptions): void {
    const { renderInfo } = options;
    let hasPutBlogMeta = false;
    let tsxembedCounter = 0;

    const defaultRenderer = md.renderer.rules.fence!.bind(md.renderer.rules);

    md.renderer.rules.fence = (tokens, idx, mdOptions, env, slf) => {
        const token = tokens[idx];

        if (!token.info) return defaultRenderer(tokens, idx, mdOptions, env, slf);
        const info = md.utils.unescapeAll(token.info).trim();
        const infos = info.split(/\s+/g);
        if (infos.length === 0) return defaultRenderer(tokens, idx, mdOptions, env, slf);

        if (infos[0] === 'tsx' && infos[1] === 'embed') {
            const tag = 'tsxembed-' + (tsxembedCounter++);
            renderInfo.tsxembed ??= new Map();
            renderInfo.tsxembed.set(tag, token.content);
            return `<${tag}></${tag}>`;
        }

        if (infos[0] === 'blog') {
            const blogMeta = Toml.parse(token.content);
            if (!hasPutBlogMeta) {
                hasPutBlogMeta = true;
                renderInfo.blogMeta = blogMeta;
            }
            return '';
        }

        return defaultRenderer(tokens, idx, mdOptions, env, slf);
    };
}
