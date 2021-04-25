/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */



import Lab from '@hapi/lab'
import Code from '@hapi/code'


const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect



import { Jsonic } from 'jsonic'
import { MultiSource } from '../multisource'
import { FileResolver } from '../resolver/file'



describe('multisource', function() {
  it('happy', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      basepath: __dirname,
      resolver: FileResolver,
    })

    expect(j0('a:1,b:@"./t01.jsonic"')).equals({ a: 1, b: { c: 2 } })

    expect(j0('a:1,b:@"./t02.jsonic",c:3'))
      .equals({ a: 1, b: { d: 2, e: { f: 4 } }, c: 3 })
  })
})

