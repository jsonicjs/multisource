import { Plugin, Context } from 'jsonic';
import { makeMemResolver } from './resolver/mem';
import { makeFileResolver } from './resolver/file';
interface Resolution {
    path: string;
    full: string;
    base: string;
    src?: string;
}
declare type Resolver = (path: string, ctx?: Context) => Resolution;
declare const TOP: unique symbol;
declare let MultiSource: Plugin;
export { MultiSource, Resolver, Resolution, TOP, Context, makeFileResolver, makeMemResolver, };
