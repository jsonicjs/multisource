import Fs from 'fs'
import Path from 'path'

import { Rule, Context } from 'jsonic'

import {
  MultiSourceOptions,
  Resolver,
  Resolution,
  resolvePathSpec,
  NONE,
} from '../multisource'


import {
  buildPotentials
} from './mem'


function makeFileResolver(): Resolver {

  return function FileResolver(
    spec: any,
    popts: MultiSourceOptions,
    _rule: Rule,
    ctx: Context,
  ): Resolution {
    let ps = resolvePathSpec(popts, ctx, spec, resolvefolder)
    let src = undefined

    // console.log(ps)

    if (null != ps.full) {
      ps.full = Path.resolve(ps.full)

      src = load(ps.full)

      if (null == src && NONE === ps.kind) {
        let potentials =
          buildPotentials(ps, popts, (...s) =>
            Path.resolve(s.reduce((a, p) => Path.join(a, p))))

        for (let path of potentials) {
          if (null != (src = load(path))) {
            ps.full = path
            ps.kind = (path.match(/\.([^.]*)$/) || [NONE, NONE])[1]
            break
          }
        }
      }
    }

    let res: Resolution = {
      ...ps,
      src,
      found: null != src
    }

    return res
  }
}

function resolvefolder(path: string) {
  if ('string' !== typeof path) {
    throw new Error('@jsonic/multisource/resolver/file: ' +
      'meta parameter multisource.path must be a string')
  }

  let folder = path
  let pathstats = Fs.statSync(path)

  if (pathstats.isFile()) {
    let pathdesc = Path.parse(path)
    folder = pathdesc.dir
  }

  return folder
}


// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path: string) {
  // console.log('LOAD', path)
  try {
    return Fs.readFileSync(path).toString()
  }
  catch (e) {
    // NOTE: don't need this, as in all cases, we consider failed
    // reads to indicate non-existence.
  }
}


export {
  makeFileResolver,
}
