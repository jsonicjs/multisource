

import { Context } from 'jsonic'
import { Resolver, Resolution } from '../multisource'


function makeMemResolver(map: { [fullpath: string]: string }): Resolver {

  return function MemResolver(path: string, ctx?: Context): Resolution {
    let msmeta = ctx && ctx.meta && ctx.meta.multisource || {}
    let popts = ctx && ctx.opts && ctx.opts &&
      ctx.opts.plugin && ctx.opts.plugin.multisource || {}

    let basepath = null == msmeta.path ? popts.path : msmeta.path

    let isabsolute = path.startsWith('/')
    let fullpath =
      isabsolute ? path : (null == basepath ? '' : basepath) + '/' + path

    //console.log('MEM', path, basepath, isabsolute, fullpath)

    let src = map[fullpath]

    return {
      path: path,
      full: fullpath,
      base: basepath,
      src,
    }
  }
}


export {
  makeMemResolver
}
