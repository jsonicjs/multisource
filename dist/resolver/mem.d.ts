import { Resolver } from '../multisource';
declare function makeMemResolver(map: {
    [fullpath: string]: string;
}): Resolver;
export { makeMemResolver };
