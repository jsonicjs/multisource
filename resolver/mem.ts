

import { Context } from 'jsonic'
import { Resolver, Resolution } from '../multisource'


function makeMemResolver(map: { [fullpath: string]: string }): Resolver {

  return function MemResolver(path: string, ctx: Context): Resolution {
    let basepath = ctx.meta.multisource ? ctx.meta.multisource.path : undefined
    basepath = null == basepath ? ctx.opts.plugin.multisource.path : basepath

    let fullpath = path.startsWith('/') ? path :
      (null == basepath ? '' : basepath) + '/' + path

    // console.log('MEM', basepath, path, fullpath)

    let src = map[fullpath]

    return {
      path: fullpath,
      src,
    }
  }
}


export {
  makeMemResolver
}
