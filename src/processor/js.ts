/* Copyright (c) 2021 Richard Rodger, MIT License */


import {
  Processor,
  Resolution,
} from '../multisource'


function makeJavaScriptProcessor(opts?: {
  evalOnly?: boolean
}): Processor {

  const JavaScriptProcessor = (
    res: Resolution,
  ) => {
    res.val = evaluate(res, opts)
  }

  JavaScriptProcessor.opts = opts

  return JavaScriptProcessor
}

// TODO: too simplistic - handle more module cases
function evaluate(res: Resolution, opts?: any) {
  let out = undefined
  if (true !== opts?.evalOnly && undefined !== typeof (require)) {
    out = require((res.full as string))
  }
  else {
    let exports = null
    let module = { exports }
    eval((res.src as string))
    out = module.exports
  }
  return out
}

export {
  makeJavaScriptProcessor
}
