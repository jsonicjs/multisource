import { Resolver } from '../multisource';
declare function makePkgResolver(options: {
    require: Function | string | string[];
}): Resolver;
export { makePkgResolver, };
