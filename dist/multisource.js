"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOP = exports.NONE = exports.resolvePathSpec = exports.MultiSource = void 0;
const directive_1 = require("@jsonic/directive");
const jsonic_1 = require("./processor/jsonic");
const js_1 = require("./processor/js");
// Unknown source reference file extension.
const NONE = '';
exports.NONE = NONE;
// The top of the dependence tree.
const TOP = Symbol('TOP');
exports.TOP = TOP;
const MultiSource = (jsonic, popts) => {
    const markchar = popts.markchar;
    const resolver = popts.resolver;
    const processor = popts.processor;
    // Normalize implicit extensions to format `.name`.
    const implictExt = (popts.implictExt || []);
    for (let extI = 0; extI < implictExt.length; extI++) {
        let ext = implictExt[extI];
        implictExt[extI] = ext.startsWith('.') ? ext : '.' + ext;
    }
    jsonic.options({
        error: {
            multisource_not_found: 'source not found: $path',
        },
        hint: {
            multisource_not_found: 'TODO: PATH: $path DETAILS: $details',
        },
    });
    // Define a directive that can load content from multiple sources.
    let dopts = {
        name: 'multisource',
        open: markchar,
        action: (rule, ctx) => {
            var _a;
            let spec = rule.child.node;
            let res = resolver(spec, popts, rule, ctx, jsonic);
            if (!res.found) {
                return (_a = rule.parent) === null || _a === void 0 ? void 0 : _a.o0.bad('multisource_not_found', { ...res });
            }
            res.kind = null == res.kind ? NONE : res.kind;
            let proc = processor[res.kind] || processor[NONE];
            proc(res, popts, rule, ctx, jsonic);
            rule.node = res.val;
        },
    };
    jsonic.use(directive_1.Directive, dopts);
};
exports.MultiSource = MultiSource;
// Convenience maker for Processors
function makeProcessor(process) {
    return (res) => (res.val = process(res.src, res));
}
// Default is just to insert file contents as a string.
const defaultProcessor = makeProcessor((src) => src);
// TODO: use json plugin to get better error msgs.
const jsonProcessor = makeProcessor((src) => null == src ? undefined : JSON.parse(src));
const jsonicProcessor = (0, jsonic_1.makeJsonicProcessor)();
const jsProcessor = (0, js_1.makeJavaScriptProcessor)();
MultiSource.defaults = {
    markchar: '@',
    processor: {
        [NONE]: defaultProcessor,
        jsonic: jsonicProcessor,
        jsc: jsonicProcessor,
        json: jsonProcessor,
        js: jsProcessor,
    },
    implictExt: ['jsonic', 'jsc', 'json', 'js'],
};
function resolvePathSpec(popts, ctx, spec, resolvefolder) {
    var _a;
    let msmeta = (_a = ctx.meta) === null || _a === void 0 ? void 0 : _a.multisource;
    let base = resolvefolder(null == msmeta || null == msmeta.path ? popts.path : msmeta.path);
    let path = 'string' === typeof spec
        ? spec
        : null != spec.path
            ? '' + spec.path
            : undefined;
    let abs = !!((path === null || path === void 0 ? void 0 : path.startsWith('/')) || (path === null || path === void 0 ? void 0 : path.startsWith('\\')));
    let full = abs
        ? path
        : null != path && '' != path
            ? null != base && '' != base
                ? base + '/' + path
                : path
            : undefined;
    let kind = null == full ? NONE : (full.match(/\.([^.]*)$/) || [NONE, NONE])[1];
    let res = {
        kind,
        path,
        full,
        base,
        abs,
        found: false,
    };
    // console.log('RES', res)
    return res;
}
exports.resolvePathSpec = resolvePathSpec;
//# sourceMappingURL=multisource.js.map