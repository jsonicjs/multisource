"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePkgResolver = makePkgResolver;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multisource_1 = require("../multisource");
const mem_1 = require("./mem");
function makePkgResolver(options) {
    let useRequire = require;
    let requireOptions = undefined;
    if ('function' === typeof options.require) {
        useRequire = options.require;
    }
    else if (Array.isArray(options.require)) {
        requireOptions = {
            paths: options.require
        };
    }
    else if ('string' === typeof options.require) {
        requireOptions = {
            paths: [options.require]
        };
    }
    return function PkgResolver(spec, popts, _rule, ctx) {
        // TODO: support pathfinder as file.ts
        let foundSpec = spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        let search = [];
        if (null != ps.path) {
            try {
                ps.full = useRequire.resolve(ps.path, requireOptions);
                if (null != ps.full) {
                    src = load(ps.full);
                    ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                }
            }
            catch (me) {
                search.push(...(requireOptions?.paths || (useRequire.resolve.paths(ps.path)
                    .map((p) => path_1.default.join(p, ps.path)))));
                let potentials = [];
                if (ps.path && 'string' === typeof ps.path) {
                    // Add the main paths of the current require
                    potentials.push(...useRequire.main.paths.map((p) => p + ps.path));
                    // Remove module name prefix
                    const subpath = ps.path.replace(/^(@[^/]+\/)?[^/]+\//, '');
                    potentials.push(...useRequire.main.paths
                        .map((p) => p.replace(/node_modules$/, subpath)));
                }
                potentials.push(...(0, mem_1.buildPotentials)(ps, popts, (...s) => path_1.default.resolve(s.reduce((a, p) => path_1.default.join(a, p)))));
                // Check longest paths first
                potentials.sort((a, b) => b.length - a.length);
                for (let path of potentials) {
                    try {
                        ps.full = useRequire.resolve(path, requireOptions);
                        if (null != ps.full) {
                            src = load(ps.full);
                            ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                            break;
                        }
                    }
                    catch (me) {
                        search.push(...(requireOptions?.paths || (useRequire.resolve.paths(path)
                            .map((p) => path_1.default.join(p, path)))));
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