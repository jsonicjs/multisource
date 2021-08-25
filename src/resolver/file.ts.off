
import Fs from 'fs'
import Path from 'path'



import { Context } from 'jsonic'
import { Resolver, Resolution } from '../multisource'


function makeFileResolver(): Resolver {

  return function FileResolver(path: string, ctx?: Context): Resolution {
    let msmeta = ctx && ctx.meta && ctx.meta.multisource || {}
    let popts = ctx && ctx.opts && ctx.opts &&
      ctx.opts.plugin && ctx.opts.plugin.multisource || {}

    let basefile =
      null == msmeta.path ?
        null == popts.path ?
          path : popts.path : msmeta.path

    let fstats = Fs.statSync(basefile)
    let basepath = basefile

    if (fstats.isFile()) {
      let basedesc = Path.parse(basefile)
      basepath = basedesc.dir
    }

    let isabsolute = Path.isAbsolute(path)
    let fullpath = isabsolute ? path :
      (null == basepath ? path : Path.resolve(basepath, path))

    let src = Fs.readFileSync(fullpath).toString()

    return {
      path: path,
      full: fullpath,
      base: basepath,
      src,
    }
  }
}


export {
  makeFileResolver
}
