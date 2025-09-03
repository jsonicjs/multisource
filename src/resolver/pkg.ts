import SystemFs from 'node:fs'
import Path from 'node:path'
// import Module from 'node:module'

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


function makePkgResolver(options: {
  require: Function | string | string[]
}): Resolver {
  let useRequire: {
    resolve: (target: string, options?: any) => any
    main: {
      paths: string[]
    }
  } = require as any

  let requireOptions: any = undefined

  if ('function' === typeof options.require) {
    useRequire = options.require as any
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
    let fs = SystemFs

    // TODO: support pathfinder as file.ts

    // TODO: support virtual fs
    // const base = ctx.meta?.multisource?.path ?? ctx.meta?.path

    let foundSpec = spec

    let ps = resolvePathSpec(popts, ctx, foundSpec, resolvefolder)
    let src = undefined
    let search: string[] = []

    if (null != ps.path) {
      try {
        ps.full = useRequire.resolve(ps.path, requireOptions)
        if (null != ps.full) {
          src = load(ps.full, fs)
          ps.kind = (ps.full.match(/\.([^.]*)$/) || [NONE, NONE])[1]
        }
      }
      catch (me: any) {
        search.push(ps.path)
        // search.push(...(requireOptions?.paths || (useRequire.resolve.paths(ps.path)
        //   .map((p: string) => Path.join(p, (ps.path as string))))))

        let potentials = []

        if (null == ctx.meta?.fs) {
          let localpath = Path.join(process.cwd(), 'NIL')
          let localparts
          do {
            localparts = Path.parse(localpath)
            localpath = localparts.dir
            potentials.push(Path.join(localpath, 'node_modules', ps.path))
          }
          while (localparts.root !== localparts.dir)
        }
        else {
          potentials.push(ps.path)
        }

        if (null != ps.path && 'string' === typeof ps.path) {
          const pspath = ps.path

          // Add the main paths of the current require
          potentials.push(...useRequire.main.paths.map((p: string) => Path.join(p, pspath)))

          // Remove module name prefix
          const subpath = ps.path.replace(/^(@[^/]+\/)?[^/]+\//, '')
          potentials.push(...useRequire.main.paths
            .map((p: string) => p.replace(/node_modules$/, subpath))
          )
        }

        potentials.push(
          ...buildPotentials(ps, popts, (...s) =>
            Path.resolve(s.reduce((a, p) => Path.join(a, p)))))

        // Check longest paths first
        potentials.sort((a, b) => b.length - a.length)


        console.log('POT', potentials)

        requireOptions = { paths: ['/'] }

        for (let path of potentials) {
          try {
            ps.full = useRequire.resolve(path, requireOptions)
            console.log('REQ', path, ps)
            if (null != ps.full) {
              src = load(ps.full, fs)
              ps.kind = (ps.full.match(/\.([^.]*)$/) || [NONE, NONE])[1]
              break
            }
          }
          catch (me: any) {
            console.log(me)
            search.push(path)
            // search.push(...(requireOptions?.paths || (useRequire.resolve.paths(path)
            // .map((p: string) => Path.join(p, (path as string))))))
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
  makePkgResolver,
}
