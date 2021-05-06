
import Fs from 'fs'
import Path from 'path'



import { Context } from 'jsonic'
import { Resolver, Resolution } from '../multisource'


function makeFileResolver(): Resolver {

  return function FileResolver(path: string, ctx: Context): Resolution {
    let basefile = ctx.meta.multisource ? ctx.meta.multisource.path : undefined
    basefile = null == basefile ? ctx.opts.plugin.multisource.path : basefile

    let fstats = Fs.statSync(basefile)
    let basepath = basefile

    if (fstats.isFile()) {
      let basedesc = Path.parse(basefile)
      basepath = basedesc.dir
    }

    let fullpath = Path.isAbsolute(path) ? path :
      (null == basepath ? path : Path.resolve(basepath, path))

    // console.log('FILE', basepath, path, fullpath)

    let src = Fs.readFileSync(fullpath).toString()

    return {
      path: fullpath,
      src,
    }
  }
}


export {
  makeFileResolver
}
