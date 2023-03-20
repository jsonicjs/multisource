"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePkgResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multisource_1 = require("../multisource");
const mem_1 = require("./mem");
function makePkgResolver(options) {
    const useRequire = options.require || require;
    return function PkgResolver(spec, popts, _rule, ctx) {
        let foundSpec = spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        let search = [];
        if (null != ps.path) {
            try {
                ps.full = useRequire.resolve(ps.path);
                if (null != ps.full) {
                    src = load(ps.full);
                }
            }
            catch (me) {
                search.push(...(useRequire.resolve.paths(ps.path)
                    .map((p) => path_1.default.join(p, ps.path))));
                let potentials = (0, mem_1.buildPotentials)(ps, popts, (...s) => path_1.default.resolve(s.reduce((a, p) => path_1.default.join(a, p))));
                for (let path of potentials) {
                    try {
                        ps.full = useRequire.resolve(path);
                        if (null != ps.full) {
                            src = load(ps.full);
                        }
                    }
                    catch (me) {
                        search.push(...(useRequire.resolve.paths(path)
                            .map((p) => path_1.default.join(p, path))));
                    }
                }
            }
        }
        let res = {
            ...ps,
            src,
            found: null != src,
            search,
        };
        return res;
    };
}
exports.makePkgResolver = makePkgResolver;
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
//# sourceMappingURL=pkg.js.map