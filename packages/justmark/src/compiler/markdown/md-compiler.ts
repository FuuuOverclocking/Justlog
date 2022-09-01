import MarkdownIt from 'markdown-it';
import HTMLtoJSX from 'htmltojsx';
import * as cheerio from 'cheerio';
import { CompilerInnerOptions } from '../../types';
import { justmarkPlugin } from './markdown-it-justmark';
import { RenderInfo } from './compiler-types';

const htmlToJsxConverter = new HTMLtoJSX({
    createClass: false,
    indent: '    ',
});

export class MdCompiler {
    private static readonly thirdPartyPlugins = [
        require('markdown-it-sub'),
        require('markdown-it-sup'),
        require('markdown-it-abbr'),
        require('markdown-it-footnote'),
        require('markdown-it-mark'),
        require('@iktakahiro/markdown-it-katex'),
        [
            require('markdown-it-multimd-table'),
            {
                multiline: false,
                rowspan: true,
                headerless: true,
            },
        ],
        require('markdown-it-textual-uml'),
    ];
    private static generateMarkdownIt(
        opts: CompilerInnerOptions,
        mdCompiler: MdCompiler,
    ): MarkdownIt {
        const md = new MarkdownIt({
            html: true,
            xhtmlOut: true,
            langPrefix: '',
            linkify: true,
            typographer: false,
            highlight: null,
        });

        MdCompiler.thirdPartyPlugins.forEach((plugin: any) => {
            if (Array.isArray(plugin)) {
                md.use(...(plugin as [any, any]));
            } else {
                md.use(plugin);
            }
        });

        md.use(justmarkPlugin, {
            mdCompiler,
        });

        return md;
    }

    private mdIt: MarkdownIt;
    public renderInfo: Partial<RenderInfo> = {};

    private static instance: MdCompiler | undefined;
    public static getInstance(options: CompilerInnerOptions): MdCompiler {
        this.instance ??= new MdCompiler(options);
        this.instance.reset();
        return this.instance;
    }

    private constructor(options: CompilerInnerOptions) {
        this.mdIt = MdCompiler.generateMarkdownIt(options, this);
    }

    private reset(): void {
        this.renderInfo = {};
    }

    public compileMarkdown(markdown: string): string {
        const html = this.mdIt.render(markdown);
        const info = this.renderInfo;

        // 得到的 meta 还可能缺少 title 一项
        const meta = info.blogMeta ?? {};
        // 查找第一个 h1, 获取标题
        if (!meta.title) {
            const $ = cheerio.load(html);
            meta.title = $('h1').text() ?? '';
        }

        let jsx = htmlToJsxConverter.convert(html);

        if (info.tsxembed) {
            for (const [tag, code] of info.tsxembed.entries()) {
                jsx = jsx.replace(`<${tag} />`, code);
            }
        }

        const metaString = JSON.stringify(meta, null, 4);
        return `{ ...${metaString}, content: ${jsx} }`;
    }
}
