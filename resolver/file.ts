
import Fs from 'fs'
import Path from 'path'

import { Jsonic, Context } from 'jsonic'

import { Resolver } from '../multisource'

const FileResolver: Resolver = (
  path: string,
  jsonic: Jsonic,
  ctx: Context,
  opts: any
) => {

  // TODO: needs more thought
  let basepath = ctx.meta.basepath || opts.basepath

  let fullpath = Path.resolve(basepath, path)
  let filedesc = Path.parse(fullpath)
  let filebase = filedesc.dir
  // let file_ext = filedesc.ext.toLowerCase()

  let content = Fs.readFileSync(fullpath).toString()

  let partial_ctx = {
    root: ctx.root
  }


  let val = jsonic(
    content,
    { basepath: filebase, fileName: fullpath },
    partial_ctx
  )

  return val
}


export {
  FileResolver
}
