import Fs from 'fs'
import Path from 'path'

import { Rule, Context } from '@jsonic/jsonic-next'

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


type PathFinder = (spec: any) => string

function makeFileResolver(pathfinder?: PathFinder): Resolver {

  return function FileResolver(
    spec: any,
    popts: MultiSourceOptions,
    _rule: Rule,
    ctx: Context,
  ): Resolution {
    let foundSpec = pathfinder ? pathfinder(spec) : spec

    let ps = resolvePathSpec(popts, ctx, foundSpec, resolvefolder)
    let src = undefined

    let search: string[] = []

    if (null != ps.full) {
      ps.full = Path.resolve(ps.full)

      search.push(ps.full)
      src = load(ps.full)

      if (null == src && NONE === ps.kind) {
        let potentials =
          buildPotentials(ps, popts, (...s) =>
            Path.resolve(s.reduce((a, p) => Path.join(a, p))))
        search.push(...potentials)

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
      found: null != src,
      search,
    }

    return res
  }
}

function resolvefolder(path: string) {
  if ('string' !== typeof path) {
    return path
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
