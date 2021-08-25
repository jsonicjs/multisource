"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJsonicProcessor = void 0;
const multisource_1 = require("../multisource");
function makeJsonicProcessor() {
    return function JsonicProcessor(res, _popts, _rule, ctx, jsonic) {
        var _a;
        if (null != res.src && null != res.full) {
            // Pass down any meta info.
            let msmeta = ((_a = ctx.meta) === null || _a === void 0 ? void 0 : _a.multisource) || {};
            let meta = {
                ...(ctx.meta || {}),
                multisource: {
                    ...msmeta,
                    path: res.full
                }
            };
            // console.log('PM', meta, res)
            res.val = jsonic(res.src, meta);
            // Build dependency tree branch.
            if (msmeta.deps) {
                let depmap = msmeta.deps;
                let parent = (msmeta.path || multisource_1.TOP);
                if (null != parent) {
                    let dep = {
                        tar: parent,
                        src: res.full,
                        wen: Date.now()
                    };
                    depmap[parent] = depmap[parent] || {};
                    depmap[parent][res.full] = dep;
                }
            }
        }
    };
}
exports.makeJsonicProcessor = makeJsonicProcessor;
//# sourceMappingURL=jsonic.js.map