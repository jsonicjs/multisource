import { Resolver } from '../multisource';
declare type PathFinder = (spec: any) => string;
declare function makeFileResolver(pathfinder?: PathFinder): Resolver;
export { makeFileResolver, };
