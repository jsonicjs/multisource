
import Fs from 'fs'
import Path from 'path'


abstract class Resolver {
  abstract resolve(path: string, opts: any): any
}


class FileResolver extends Resolver {
  resolve(path: string, opts: any) {

  }
}


export {
  FileResolver
}
