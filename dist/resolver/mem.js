"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMemResolver = void 0;
function makeMemResolver(map) {
    return function MemResolver(path, ctx) {
        let msmeta = ctx && ctx.meta && ctx.meta.multisource || {};
        let popts = ctx && ctx.opts && ctx.opts &&
            ctx.opts.plugin && ctx.opts.plugin.multisource || {};
        let basepath = null == msmeta.path ? popts.path : msmeta.path;
        let isabsolute = path.startsWith('/');
        let fullpath = isabsolute ? path : (null == basepath ? '' : basepath) + '/' + path;
        //console.log('MEM', path, basepath, isabsolute, fullpath)
        let src = map[fullpath];
        return {
            path: path,
            full: fullpath,
            base: basepath,
            src,
        };
    };
}
exports.makeMemResolver = makeMemResolver;
//# sourceMappingURL=mem.js.map