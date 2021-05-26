/* Copyright (c) 2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMemResolver = exports.makeFileResolver = exports.TOP = exports.MultiSource = void 0;
const jsonic_1 = require("jsonic");
// TODO: get package sub file refs working with ts
const mem_1 = require("./resolver/mem");
Object.defineProperty(exports, "makeMemResolver", { enumerable: true, get: function () { return mem_1.makeMemResolver; } });
const file_1 = require("./resolver/file");
Object.defineProperty(exports, "makeFileResolver", { enumerable: true, get: function () { return file_1.makeFileResolver; } });
//import { Json } from './json'
//import { Csv } from './csv'
/* $lab:coverage:on$ */
// TODO: .jsonic suffix optional
// TODO: jsonic-cli should provide basepath
// TODO: auto load index.jsonic, index.<folder-name>.jsonic
let DEFAULTS = {
    markchar: '@',
};
const TOP = Symbol('TOP');
exports.TOP = TOP;
let MultiSource = function multisource(jsonic) {
    let popts = jsonic_1.util.deep({}, DEFAULTS, jsonic.options.plugin.multisource);
    let markchar = popts.markchar;
    let resolver = popts.resolver;
    let tn = '#T<' + markchar + '>';
    jsonic.options({
        token: {
            [tn]: { c: markchar }
        },
        error: {
            multifile_unsupported_file: 'unsupported file: $path'
        },
        hint: {
            multifile_unsupported_file: `This file type is not supported and cannot be parsed: $path.`,
        },
    });
    // These inherit previous plugins - they are not clean new instances.
    //let json = jsonic.make().use(Json, jsonic.options.plugin.json || {})
    //let csv = jsonic.make().use(Csv, jsonic.options.plugin.csv || {})
    let ST = jsonic.token.ST;
    let AT = jsonic.token(tn);
    jsonic.rule('val', (rs) => {
        rs.def.open.push({ s: [AT, ST] });
        let orig_bc = rs.def.bc;
        rs.def.bc = function (rule, ctx) {
            if (rule.open[0] && AT === rule.open[0].tin) {
                // console.log('MS res meta', ctx.meta)
                let val = undefined;
                let path = rule.open[1].val;
                let res = resolver(path, ctx);
                if (null != res.src) {
                    let msmeta = ctx.meta.multisource || {};
                    let meta = {
                        ...ctx.meta,
                        multisource: {
                            ...msmeta,
                            path: res.full
                        }
                    };
                    // console.log('MSMETA path', path, res.full)
                    val = jsonic(res.src, meta);
                    if (msmeta.deps) {
                        let depmap = msmeta.deps;
                        let parent = (msmeta.path || TOP);
                        if (null != parent) {
                            (depmap[parent] = depmap[parent] || {})[res.full] = {
                                tar: parent,
                                src: res.full,
                                wen: Date.now()
                            };
                        }
                    }
                }
                rule.open[0].val = val;
            }
            return orig_bc(...arguments);
        };
        return rs;
    });
};
exports.MultiSource = MultiSource;
//# sourceMappingURL=multisource.js.map