import { Jsonic, Context, Rule, Plugin } from '@jsonic/jsonic-next';
interface MultiSourceMeta {
    path?: string;
    deps?: DependencyMap;
}
declare const NONE = "";
declare type MultiSourceOptions = {
    resolver: Resolver;
    path?: string;
    markchar?: string;
    processor?: {
        [kind: string]: Processor;
    };
    implictExt?: [];
};
declare type PathSpec = {
    kind: string;
    path?: string;
    full?: string;
    base?: string;
    abs: boolean;
};
declare type Resolution = PathSpec & {
    src?: string;
    val?: any;
    found: boolean;
};
declare type Resolver = (spec: PathSpec, popts: MultiSourceOptions, rule: Rule, ctx: Context, jsonic: Jsonic) => Resolution;
declare type Processor = (res: Resolution, popts: MultiSourceOptions, rule: Rule, ctx: Context, jsonic: Jsonic) => void;
declare type Dependency = {
    tar: string | typeof TOP;
    src: string;
    wen: number;
};
declare type DependencyMap = {
    [tar_full_path: string]: {
        [src_full_path: string]: Dependency;
    };
};
declare const TOP: unique symbol;
declare const MultiSource: Plugin;
declare function resolvePathSpec(popts: MultiSourceOptions, ctx: Context, spec: any, resolvefolder: (path: string) => string): PathSpec;
export type { Resolver, Resolution, Processor, MultiSourceOptions, Dependency, DependencyMap, MultiSourceMeta, PathSpec, };
export { MultiSource, resolvePathSpec, NONE, TOP, };
