import { Resolver } from '../multisource';
type PathFinder = (spec: any) => string;
export declare function makeFileResolver(pathfinder?: PathFinder): Resolver;
export {};
