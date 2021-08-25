"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMemResolver = exports.buildPotentials = void 0;
const multisource_1 = require("../multisource");
function makeMemResolver(filemap) {
    return function MemResolver(spec, popts, _rule, ctx) {
        let ps = multisource_1.resolvePathSpec(popts, ctx, spec, makeresolvefolder(filemap));
        let src = undefined;
        if (null != ps.full) {
            src = filemap[ps.full];
            if (null == src && multisource_1.NONE === ps.kind) {
                let potentials = buildPotentials(ps, popts, (...s) => s.reduce((a, p) => a + '/' + p));
                for (let path of potentials) {
                    if (null != (src = filemap[path])) {
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
exports.makeMemResolver = makeMemResolver;
function makeresolvefolder(filemap) {
    return function resolvefolder(path) {
        let folder = path;
        if (filemap[path]) {
            folder = (path
                .replace(/[\\\/]+$/, '')
                .match(/[\\\/]+([^\\\/]+)$/) || ['', ''])[1];
            // console.log('PF', path, folder)
        }
        // console.log('RF', folder)
        return folder;
    };
}
function buildPotentials(ps, popts, pathjoin) {
    let full = ps.full;
    let potentials = [];
    let implictExt = popts.implictExt || [];
    // Implicit extensions.
    for (let ext of implictExt) {
        potentials.push(full + ext);
    }
    // Folder index file.
    for (let ext of implictExt) {
        potentials.push(pathjoin(full, 'index' + ext));
    }
    // Folder index file (includes folder name).
    if (null != ps.path) {
        let folder = (ps.path
            .replace(/[\\\/]+$/, '')
            .match(/[^\\\/]+$/) || [])[0];
        if (null != folder) {
            for (let ext of implictExt) {
                potentials.push(pathjoin(full, 'index.' + folder + ext));
            }
        }
    }
    // console.log(potentials)
    return potentials;
}
exports.buildPotentials = buildPotentials;
//# sourceMappingURL=mem.js.map