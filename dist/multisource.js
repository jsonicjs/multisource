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
    const { deep } = jsonic.util;
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
            // TODO: use $details for more explanation in error message.
            // In particular to show resolved absolute path.
            multisource_not_found: 'The source path $path was not found.',
        },
    });
    // Define a directive that can load content from multiple sources.
    let dopts = {
        name: 'multisource',
        open: markchar,
        rules: {
            open: 'val,pair'
        },
        action: function multisourceStateAction(rule, ctx) {
            var _a;
            let from = rule.parent.name;
            let spec = rule.child.node;
            // console.log('SRC', from, spec)
            let res = resolver(spec, popts, rule, ctx, jsonic);
            if (!res.found) {
                return (_a = rule.parent) === null || _a === void 0 ? void 0 : _a.o0.bad('multisource_not_found', { ...res });
            }
            res.kind = null == res.kind ? NONE : res.kind;
            let proc = processor[res.kind] || processor[NONE];
            proc(res, popts, rule, ctx, jsonic);
            // Handle the {@foo} case, injecting keys into parent map.
            if ('pair' === from) {
                if (ctx.cfg.map.merge) {
                    rule.parent.parent.node =
                        ctx.cfg.map.merge(rule.parent.parent.node, res.val, rule, ctx);
                }
                else if (ctx.cfg.map.extend) {
                    rule.parent.parent.node = deep(rule.parent.parent.node, res.val);
                }
                else {
                    Object.assign(rule.parent.node, res.val);
                }
            }
            else {
                rule.node = res.val;
            }
            // rule.node = res.val
            return undefined;
        },
        custom: (jsonic, { OPEN, name }) => {
            // Handle special case of @foo first token - assume a map
            jsonic
                .rule('val', (rs) => {
                rs.open({
                    s: [OPEN],
                    c: (r) => 0 === r.d,
                    p: 'map',
                    b: 1,
                    n: { [name + '_top']: 1 }
                });
            });
            jsonic
                .rule('map', (rs) => {
                rs.open({
                    s: [OPEN],
                    c: (r) => (1 === r.d && 1 === r.n[name + '_top']),
                    p: 'pair',
                    b: 1,
                });
            });
        }
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
    return res;
}
exports.resolvePathSpec = resolvePathSpec;
//# sourceMappingURL=multisource.js.map