/* Copyright (c) 2021 Richard Rodger, MIT License */

import { Jsonic, Context, Rule, Plugin } from '@jsonic/jsonic-next'
import { Directive, DirectiveOptions } from '@jsonic/directive'

import { makeJsonicProcessor } from './processor/jsonic'
import { makeJavaScriptProcessor } from './processor/js'

// TODO: jsonic-cli should provide basepath

// Jsonic parsing meta data. In this case, storing the dependency tree.
interface MultiSourceMeta {
  path?: string // Base path for this parse run.
  deps?: DependencyMap // Provide an empty object to be filled.
}

// Unknown source reference file extension.
const NONE = ''

// Options for this plugin.
type MultiSourceOptions = {
  resolver: Resolver // Resolve multisource spec to source
  path?: string // Base path, prefixed to paths
  markchar?: string // Character to mark start of multisource directive
  processor?: { [kind: string]: Processor }
  implictExt?: []
}

// The path to the source, including base prefix (if any).
type PathSpec = {
  kind: string // Source kind, usually normalized file extension
  path?: string // Original path (possibly relative)
  full?: string // Normalized full path
  base?: string // Current base path
  abs: boolean // Path was absolute
}

// The source and where it was found.
type Resolution = PathSpec & {
  src?: string // Undefined if no resolution
  val?: any // Undefined if no resolution
  found: boolean // True if source file was found
  search?: string[] // List of searched paths.
}

// Resolve the source.
type Resolver = (
  spec: PathSpec,
  popts: MultiSourceOptions,
  rule: Rule,
  ctx: Context,
  jsonic: Jsonic
) => Resolution

// Process the source into a value.
type Processor = (
  res: Resolution,
  popts: MultiSourceOptions,
  rule: Rule,
  ctx: Context,
  jsonic: Jsonic
) => void

type Dependency = {
  tar: string | typeof TOP // Target that depends on source (src).
  src: string // Source that target (tar) depends on.
  wen: number // Time of resolution.
}

// A flattened dependency tree (assumes each element is a unique full path).
type DependencyMap = {
  [tar_full_path: string]: {
    [src_full_path: string]: Dependency
  }
}

// The top of the dependence tree.
const TOP = Symbol('TOP')

const MultiSource: Plugin = (jsonic: Jsonic, popts: MultiSourceOptions) => {
  const markchar = popts.markchar as string
  const resolver = popts.resolver as Resolver
  const processor = popts.processor as { [kind: string]: Processor }

  const { deep } = jsonic.util

  // Normalize implicit extensions to format `.name`.
  const implictExt = (popts.implictExt || []) as string[]
  for (let extI = 0; extI < implictExt.length; extI++) {
    let ext = implictExt[extI]
    implictExt[extI] = ext.startsWith('.') ? ext : '.' + ext
  }

  jsonic.options({
    error: {
      multisource_not_found: 'source not found: $path',
    },
    hint: {
      // TODO: use $details for more explanation in error message.
      // In particular to show resolved absolute path.
      multisource_not_found:
        'The source path $path was not found.\n\nSearch paths:\n${searchstr}',
    },
  })

  // Define a directive that can load content from multiple sources.
  let dopts: DirectiveOptions = {
    name: 'multisource',
    open: markchar,
    rules: {
      open: 'val,pair',
    },
    action: function multisourceStateAction(rule: Rule, ctx: Context) {
      let from = rule.parent.name
      let spec = rule.child.node
      // console.log('SRC', from, spec)

      let res = resolver(spec, popts, rule, ctx, jsonic)
      if (!res.found) {
        return rule.parent?.o0.bad('multisource_not_found', {
          ...res,
          searchstr: (res?.search || [res.full]).join('\n')
        })
      }

      res.kind = null == res.kind ? NONE : res.kind

      let proc = processor[res.kind] || processor[NONE]
      proc(res, popts, rule, ctx, jsonic)

      // Handle the {@foo} case, injecting keys into parent map.
      if ('pair' === from) {
        if (ctx.cfg.map.merge) {
          rule.parent.parent.node = ctx.cfg.map.merge(
            rule.parent.parent.node,
            res.val,
            rule,
            ctx
          )
        } else if (ctx.cfg.map.extend) {
          rule.parent.parent.node = deep(rule.parent.parent.node, res.val)
        } else {
          Object.assign(rule.parent.node, res.val)
        }
      } else {
        rule.node = res.val
      }

      // rule.node = res.val

      return undefined
    },
    custom: (jsonic: Jsonic, { OPEN, name }: any) => {
      // Handle special case of @foo first token - assume a map
      jsonic.rule('val', (rs) => {
        rs.open({
          s: [OPEN],
          c: (r) => 0 === r.d,
          p: 'map',
          b: 1,
          n: { [name + '_top']: 1 },
        })
      })

      jsonic.rule('map', (rs) => {
        rs.open({
          s: [OPEN],
          c: (r) => 1 === r.d && 1 === r.n[name + '_top'],
          p: 'pair',
          b: 1,
        })
      })
    },
  }
  jsonic.use(Directive, dopts)
}

// Convenience maker for Processors
function makeProcessor(process: (src: string, res: Resolution) => any) {
  return (res: Resolution) => (res.val = process(res.src as string, res))
}

// Default is just to insert file contents as a string.
const defaultProcessor = makeProcessor((src: string) => src)

// TODO: use json plugin to get better error msgs.
const jsonProcessor = makeProcessor((src: string) =>
  null == src ? undefined : JSON.parse(src)
)

const jsonicProcessor = makeJsonicProcessor()
const jsProcessor = makeJavaScriptProcessor()

MultiSource.defaults = {
  markchar: '@',
  processor: {
    [NONE]: defaultProcessor,
    jsonic: jsonicProcessor,
    jsc: jsonicProcessor,
    json: jsonProcessor,
    js: jsProcessor,
  },
  implictExt: ['jsonic', 'jsc', 'json', 'js'],
}


function resolvePathSpec(
  popts: MultiSourceOptions,
  ctx: Context,
  spec: any,
  resolvefolder: (path: string) => string
): PathSpec {
  let msmeta = ctx.meta?.multisource
  let base = resolvefolder(
    null == msmeta || null == msmeta.path ? popts.path : msmeta.path
  )

  let path =
    'string' === typeof spec
      ? spec
      : null != spec.path
        ? '' + spec.path
        : undefined

  let abs = !!(path?.startsWith('/') || path?.startsWith('\\'))
  let full = abs
    ? path
    : null != path && '' != path
      ? null != base && '' != base
        ? base + '/' + path
        : path
      : undefined

  let kind = null == full ? NONE : (full.match(/\.([^.]*)$/) || [NONE, NONE])[1]

  let res: Resolution = {
    kind,
    path,
    full,
    base,
    abs,
    found: false,
  }

  return res
}


export type {
  Resolver,
  Resolution,
  Processor,
  MultiSourceOptions,
  Dependency,
  DependencyMap,
  MultiSourceMeta,
  PathSpec,
}

export {
  MultiSource,
  resolvePathSpec,
  NONE,
  TOP,

  // // Re-exported from jsonic for convenience
  // Context,

  // // TODO: remove for better tree shaking
  // makeFileResolver,
  // makeMemResolver,
}
