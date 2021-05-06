/* Copyright (c) 2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict'

import { Jsonic, Plugin, Rule, RuleSpec, Context, util } from 'jsonic'
//import { Json } from './json'
//import { Csv } from './csv'
/* $lab:coverage:on$ */


// TODO: .jsonic suffix optional
// TODO: jsonic-cli should provide basepath
// TODO: auto load index.jsonic, index.<folder-name>.jsonic

let DEFAULTS = {
  markchar: '@',
  //basepath: '.',
}


interface Resolution {
  path: string
  src?: string
}


type Resolver = (path: string, ctx: Context) => Resolution


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

        let val: any = undefined
        let path = rule.open[1].val
        let res = resolver(path, ctx)

        if (null != res.src) {
          let msmeta = ctx.meta.multisource || {}
          let meta = {
            ...ctx.meta,
            multisource: {
              ...msmeta,
              path: res.path
            }
          }
          val = jsonic(res.src, meta)

          // console.log('MSMETA', path, msmeta)

          if (msmeta.deps) {
            let parent = msmeta.path || TOP
            if (null != parent) {
              (msmeta.deps[parent] = msmeta.deps[parent] || {})[res.path] = {}
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

export { MultiSource, Resolver, Resolution, TOP }
