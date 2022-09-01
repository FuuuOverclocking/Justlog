import MarkdownIt from 'markdown-it';
import Toml from 'toml';
import { RenderInfo } from './compiler-types';
import { MdCompiler } from './md-compiler';

export interface JustMarkPluginOptions {
    mdCompiler: MdCompiler;
}

export function justmarkPlugin(md: MarkdownIt, options: JustMarkPluginOptions): void {
    const { mdCompiler } = options;
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
            mdCompiler.renderInfo.tsxembed ??= new Map();
            mdCompiler.renderInfo.tsxembed.set(tag, token.content);
            return `<${tag}></${tag}>`;
        }

        if (infos[0] === 'blog') {
            const blogMeta = Toml.parse(token.content);
            if (!hasPutBlogMeta) {
                hasPutBlogMeta = true;
                mdCompiler.renderInfo.blogMeta = blogMeta;
            }
            return '';
        }

        return defaultRenderer(tokens, idx, mdOptions, env, slf);
    };
}
