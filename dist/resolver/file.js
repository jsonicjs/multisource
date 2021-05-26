"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFileResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function makeFileResolver() {
    return function FileResolver(path, ctx) {
        let msmeta = ctx && ctx.meta && ctx.meta.multisource || {};
        let popts = ctx && ctx.opts && ctx.opts &&
            ctx.opts.plugin && ctx.opts.plugin.multisource || {};
        let basefile = null == msmeta.path ?
            null == popts.path ?
                path : popts.path : msmeta.path;
        let fstats = fs_1.default.statSync(basefile);
        let basepath = basefile;
        if (fstats.isFile()) {
            let basedesc = path_1.default.parse(basefile);
            basepath = basedesc.dir;
        }
        let isabsolute = path_1.default.isAbsolute(path);
        let fullpath = isabsolute ? path :
            (null == basepath ? path : path_1.default.resolve(basepath, path));
        let src = fs_1.default.readFileSync(fullpath).toString();
        return {
            path: path,
            full: fullpath,
            base: basepath,
            src,
        };
    };
}
exports.makeFileResolver = makeFileResolver;
//# sourceMappingURL=file.js.map