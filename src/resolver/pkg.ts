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


function makePkgResolver(options: any): Resolver {
  let useRequire: any = require
  let requireOptions: any = undefined

  if ('function' === typeof options.require) {
    useRequire = options.require
  }
  else if (Array.isArray(options.require)) {
    requireOptions = {
      paths: options.require
    }
  }
  else if ('string' === typeof options.require) {
    requireOptions = {
      paths: [options.require]
    }
  }

  return function PkgResolver(
    spec: any,
    popts: MultiSourceOptions,
    _rule: Rule,
    ctx: Context,
  ): Resolution {
    // TODO: support pathfinder as file.ts

    let foundSpec = spec

    let ps = resolvePathSpec(popts, ctx, foundSpec, resolvefolder)
    let src = undefined
    let search: string[] = []

    if (null != ps.path) {
      try {
        ps.full = useRequire.resolve(ps.path, requireOptions)
        if (null != ps.full) {
          src = load(ps.full)
          ps.kind = (ps.full.match(/\.([^.]*)$/) || [NONE, NONE])[1]
        }
      }
      catch (me: any) {
        search.push(...(requireOptions?.paths || (useRequire.resolve.paths(ps.path)
          .map((p: string) => Path.join(p, (ps.path as string))))))

        let potentials =
          buildPotentials(ps, popts, (...s) =>
            Path.resolve(s.reduce((a, p) => Path.join(a, p))))

        for (let path of potentials) {
          try {
            ps.full = useRequire.resolve(path, requireOptions)
            if (null != ps.full) {
              src = load(ps.full)
              ps.kind = (ps.full.match(/\.([^.]*)$/) || [NONE, NONE])[1]
              break
            }
          }
          catch (me: any) {
            search.push(...(requireOptions?.paths || (useRequire.resolve.paths(path)
              .map((p: string) => Path.join(p, (path as string))))))
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
  makePkgResolver,
}
