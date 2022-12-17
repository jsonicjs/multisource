import { Resolver } from '../multisource';
type PathFinder = (spec: any) => string;
declare function makeFileResolver(pathfinder?: PathFinder): Resolver;
export { makeFileResolver, };
