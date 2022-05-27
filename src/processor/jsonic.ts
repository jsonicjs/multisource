/* Copyright (c) 2021 Richard Rodger, MIT License */


import { Jsonic, Rule, Context } from '@jsonic/jsonic-next'

import {
  MultiSourceOptions,
  Processor,
  Resolution,
  TOP,
  DependencyMap,
  Dependency,
  MultiSourceMeta,
} from '../multisource'


function makeJsonicProcessor(): Processor {

  return function JsonicProcessor(
    res: Resolution,
    _popts: MultiSourceOptions,
    _rule: Rule,
    ctx: Context,
    jsonic: Jsonic
  ) {
    if (null != res.src && null != res.full) {

      // Pass down any meta info.
      let msmeta: MultiSourceMeta = ctx.meta?.multisource || {}
      let meta = {
        ...(ctx.meta || {}),
        multisource: {
          ...msmeta,
          path: res.full
        }
      }

      // console.log('PM', meta, res)
      res.val = jsonic(res.src, meta)

      // Build dependency tree branch.
      if (msmeta.deps) {
        let depmap = (msmeta.deps as DependencyMap)
        let parent = (msmeta.path || TOP) as string
        if (null != parent) {
          let dep: Dependency = {
            tar: parent,
            src: res.full,
            wen: Date.now()
          }
          depmap[parent] = depmap[parent] || {}
          depmap[parent][res.full] = dep
        }
      }
    }
  }
}



export {
  makeJsonicProcessor
}
