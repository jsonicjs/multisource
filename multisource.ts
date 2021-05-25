/* Copyright (c) 2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict'

import { Jsonic, Plugin, Rule, RuleSpec, Context, util } from 'jsonic'

// TODO: get package sub file refs working with ts
import { makeMemResolver } from './resolver/mem'
import { makeFileResolver } from './resolver/file'

//import { Json } from './json'
//import { Csv } from './csv'
/* $lab:coverage:on$ */


// TODO: .jsonic suffix optional
// TODO: jsonic-cli should provide basepath
// TODO: auto load index.jsonic, index.<folder-name>.jsonic


let DEFAULTS = {
  markchar: '@',
}


interface Meta {
  path?: string  // Base path for this parse run.
  deps?: DependencyMap // Provide an empty object to be filled.
}


interface Resolution {
  path: string // Original path (possibly relative)
  full: string // Normalized full path
  base: string // Current base path
  src?: string // Undefined if no resolution
}


type Resolver = (path: string, ctx?: Context) => Resolution


interface Dependency {
  tar: string | typeof TOP, // Target that depends on source (src).
  src: string, // Source that target (tar) depends on.
  wen: number, // Time of resolution.
}

type DependencyMap = {
  [tar_full_path: string]: {
    [src_full_path: string]: Dependency
  }
}


const TOP = Symbol('TOP')


let MultiSource: Plugin = function multisource(jsonic: Jsonic) {
  let popts = util.deep({}, DEFAULTS, jsonic.options.plugin.multisource)
  let markchar = popts.markchar
  let resolver = (popts.resolver as Resolver)
  let tn = '#T<' + markchar + '>'

  jsonic.options({
    token: {
      [tn]: { c: markchar }
    },
    error: {
      multifile_unsupported_file: 'unsupported file: $path'
    },
    hint: {
      multifile_unsupported_file:
        `This file type is not supported and cannot be parsed: $path.`,
    },
  })

  // These inherit previous plugins - they are not clean new instances.
  //let json = jsonic.make().use(Json, jsonic.options.plugin.json || {})
  //let csv = jsonic.make().use(Csv, jsonic.options.plugin.csv || {})

  let ST = jsonic.token.ST
  let AT = jsonic.token(tn)


  jsonic.rule('val', (rs: RuleSpec) => {
    rs.def.open.push(
      { s: [AT, ST] }, // NOTE: must use strings to specify path: @"...path..."
    )

    let orig_bc = rs.def.bc
    rs.def.bc = function(rule: Rule, ctx: Context) {
      if (rule.open[0] && AT === rule.open[0].tin) {

        // console.log('MS res meta', ctx.meta)

        let val: any = undefined
        let path = rule.open[1].val
        let res = resolver(path, ctx)

        if (null != res.src) {
          let msmeta: Meta = ctx.meta.multisource || {}
          let meta = {
            ...ctx.meta,
            multisource: {
              ...msmeta,
              path: res.full
            }
          }

          // console.log('MSMETA', path, msmeta, meta)


          val = jsonic(res.src, meta)

          if (msmeta.deps) {
            let depmap = (msmeta.deps as DependencyMap)
            let parent = (msmeta.path || TOP) as string
            if (null != parent) {
              (depmap[parent] = depmap[parent] || {})[res.full] = {
                tar: parent,
                src: res.full,
                wen: Date.now()
              }
            }
          }

        }

        rule.open[0].val = val
      }
      return orig_bc(...arguments)
    }

    return rs
  })
}


export {
  MultiSource,
  Resolver,
  Resolution,
  TOP,

  // Re-exported from jsonic for convenience
  Context,

  // TODO: remove for better tree shaking
  makeFileResolver,
  makeMemResolver,
}
