"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJavaScriptProcessor = void 0;
function makeJavaScriptProcessor(opts) {
    const JavaScriptProcessor = (res) => {
        res.val = evaluate(res, opts);
    };
    JavaScriptProcessor.opts = opts;
    return JavaScriptProcessor;
}
exports.makeJavaScriptProcessor = makeJavaScriptProcessor;
// TODO: too simplistic - handle more module cases
function evaluate(res, _opts) {
    let out = undefined;
    // if (true !== opts?.evalOnly && undefined !== typeof (require)) {
    out = require(res.full);
    out = null != out.default ? out.default : out;
    // }
    // else {
    //   let exports = null
    //   let module = { exports }
    //   eval((res.src as string))
    //   out = module.exports
    // }
    return out;
}
//# sourceMappingURL=js.js.map