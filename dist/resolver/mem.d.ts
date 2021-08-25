import { MultiSourceOptions, Resolver, PathSpec } from '../multisource';
declare function makeMemResolver(filemap: {
    [fullpath: string]: string;
}): Resolver;
declare function buildPotentials(ps: PathSpec, popts: MultiSourceOptions, pathjoin: (...parts: string[]) => string): string[];
export { buildPotentials, makeMemResolver, };
