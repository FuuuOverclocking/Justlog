import { BlogMeta } from '../../types';

export interface RenderInfo {
    blogMeta: Partial<BlogMeta>;
    tsxembed: Map<string, string>;
}
