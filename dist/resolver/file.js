"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFileResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multisource_1 = require("../multisource");
const mem_1 = require("./mem");
function makeFileResolver(pathfinder) {
    return function FileResolver(spec, popts, _rule, ctx) {
        let foundSpec = pathfinder ? pathfinder(spec) : spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        if (null != ps.full) {
            ps.full = path_1.default.resolve(ps.full);
            src = load(ps.full);
            if (null == src && multisource_1.NONE === ps.kind) {
                let potentials = (0, mem_1.buildPotentials)(ps, popts, (...s) => path_1.default.resolve(s.reduce((a, p) => path_1.default.join(a, p))));
                for (let path of potentials) {
                    if (null != (src = load(path))) {
                        ps.full = path;
                        ps.kind = (path.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                        break;
                    }
                }
            }
        }
        let res = {
            ...ps,
            src,
            found: null != src
        };
        return res;
    };
}
exports.makeFileResolver = makeFileResolver;
function resolvefolder(path) {
    if ('string' !== typeof path) {
        return path;
    }
    let folder = path;
    let pathstats = fs_1.default.statSync(path);
    if (pathstats.isFile()) {
        let pathdesc = path_1.default.parse(path);
        folder = pathdesc.dir;
    }
    return folder;
}
// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path) {
    try {
        return fs_1.default.readFileSync(path).toString();
    }
    catch (e) {
        // NOTE: don't need this, as in all cases, we consider failed
        // reads to indicate non-existence.
    }
}
//# sourceMappingURL=file.js.map