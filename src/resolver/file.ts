
import * as SystemFs from 'node:fs'
import Path from 'path'

import type {
  FST
} from '../multisource'

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


type PathFinder = (spec: any) => string

function makeFileResolver(pathfinder?: PathFinder): Resolver {

  return function FileResolver(
    spec: any,
    popts: MultiSourceOptions,
    _rule: Rule,
    ctx: Context,
  ): Resolution {
    const fs = ctx.meta?.fs || SystemFs
    const foundSpec = pathfinder ? pathfinder(spec) : spec

    const ps = resolvePathSpec(popts, ctx, foundSpec, resolvefolder)
    let src = undefined

    let search: string[] = []

    if (null != ps.full) {
      ps.full = Path.resolve(ps.full)

      search.push(ps.full)
      src = load(ps.full, fs)

      if (null == src) {
        const potentials: string[] = []

        // Special case: support npm linked references
        if (null != ps.base && null != ps.path) {
          potentials.push(
            Path.resolve(ps.base, 'node_modules', ps.path),
            Path.resolve(Path.dirname(ps.base), 'node_modules', ps.path)
          )
        }

        if (NONE === ps.kind) {
          potentials.push(...
            buildPotentials(ps, popts, (...s) =>
              Path.resolve(s.reduce((a, p) => Path.join(a, p)))))
        }

        search.push(...potentials)

        for (let path of potentials) {
          if (null != (src = load(path, fs))) {
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

function resolvefolder(path: string, fs: FST) {
  if ('string' !== typeof path) {
    return path
  }

  let folder = path
  let pathstats = fs.statSync(path)

  if (pathstats.isFile()) {
    let pathdesc = Path.parse(path)
    folder = pathdesc.dir
  }

  return folder
}


// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path: string, fs: FST) {
  try {
    return fs.readFileSync(path).toString()
  }
  catch (e) {
    // NOTE: don't need this, as in all cases, we consider failed
    // reads to indicate non-existence.
  }
}


export {
  makeFileResolver,
}
