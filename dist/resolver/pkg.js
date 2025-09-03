"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePkgResolver = makePkgResolver;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
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
        let fs = node_fs_1.default;
        // TODO: support pathfinder as file.ts
        // TODO: support virtual fs
        // const base = ctx.meta?.multisource?.path ?? ctx.meta?.path
        let foundSpec = spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        let search = [];
        if (null != ps.path) {
            try {
                ps.full = useRequire.resolve(ps.path, requireOptions);
                if (null != ps.full) {
                    src = load(ps.full, fs);
                    ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                }
            }
            catch (me) {
                search.push(ps.path);
                // search.push(...(requireOptions?.paths || (useRequire.resolve.paths(ps.path)
                //   .map((p: string) => Path.join(p, (ps.path as string))))))
                let potentials = [];
                if (null == ctx.meta?.fs) {
                    let localpath = node_path_1.default.join(process.cwd(), 'NIL');
                    let localparts;
                    do {
                        localparts = node_path_1.default.parse(localpath);
                        localpath = localparts.dir;
                        potentials.push(node_path_1.default.join(localpath, 'node_modules', ps.path));
                    } while (localparts.root !== localparts.dir);
                }
                else {
                    potentials.push(ps.path);
                }
                if (null != ps.path && 'string' === typeof ps.path) {
                    const pspath = ps.path;
                    // Add the main paths of the current require
                    potentials.push(...useRequire.main.paths.map((p) => node_path_1.default.join(p, pspath)));
                    // Remove module name prefix
                    const subpath = ps.path.replace(/^(@[^/]+\/)?[^/]+\//, '');
                    potentials.push(...useRequire.main.paths
                        .map((p) => p.replace(/node_modules$/, subpath)));
                }
                potentials.push(...(0, mem_1.buildPotentials)(ps, popts, (...s) => node_path_1.default.resolve(s.reduce((a, p) => node_path_1.default.join(a, p)))));
                // Check longest paths first
                potentials.sort((a, b) => b.length - a.length);
                requireOptions = { paths: ['/'] };
                for (let path of potentials) {
                    try {
                        ps.full = useRequire.resolve(path, requireOptions);
                        if (null != ps.full) {
                            src = load(ps.full, fs);
                            ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                            break;
                        }
                    }
                    catch (me) {
                        search.push(path);
                        // search.push(...(requireOptions?.paths || (useRequire.resolve.paths(path)
                        // .map((p: string) => Path.join(p, (path as string))))))
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
function resolvefolder(path, fs) {
    if ('string' !== typeof path) {
        return path;
    }
    let folder = path;
    let pathstats = fs.statSync(path);
    if (pathstats.isFile()) {
        let pathdesc = node_path_1.default.parse(path);
        folder = pathdesc.dir;
    }
    return folder;
}
// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path, fs) {
    try {
        return fs.readFileSync(path).toString();
    }
    catch (e) {
        // NOTE: don't need this, as in all cases, we consider failed
        // reads to indicate non-existence.
    }
}
//# sourceMappingURL=pkg.js.map