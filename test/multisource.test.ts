/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */



import Lab from '@hapi/lab'
import Code from '@hapi/code'


const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect



import { Jsonic } from 'jsonic'
import { MultiSource, TOP } from '../multisource'
import { makeFileResolver } from '../resolver/file'
import { makeMemResolver } from '../resolver/mem'


describe('multisource', function() {

  it('file', () => {
    let r0 = makeFileResolver()
    let j0 = Jsonic.make().use(MultiSource, {
      path: __dirname,
      resolver: r0,
    })

    let deps = {}
    expect(j0('a:1,b:@"./t01.jsonic"', { multisource: { deps } }))
      .equals({ a: 1, b: { c: 2 } })
    //console.dir(deps, { depth: null })

    deps = {}
    expect(j0('a:1,b:@"./t02.jsonic",c:3', { multisource: { deps } }))
      .equals({ a: 1, b: { d: 2, e: { f: 4 } }, c: 3 })
    //console.dir(deps, { depth: null })
  })


  it('mem', () => {
    let r0 = makeMemResolver({
      '/a': 'a:1',
      '/b': 'b:@"c",',
      '/b/c': 'c:@"/a"',
      '/d': 'd:4',
    })
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: r0,
    })

    let deps = {}
    expect(j0('q:11,x:@"a",k:@"d",y:@"b",z:@"/b/c",w:22', { multisource: { deps } }))
      .equals({
        q: 11,
        x: { a: 1 },
        k: { d: 4 },
        y: { b: { c: { a: 1 } } },
        z: { c: { a: 1 } },
        w: 22,
      })

    //console.dir(deps, { depth: null })
    expect(deps).equal({
      '/b/c': { '/a': {} },
      '/b': { '/b/c': {} },
      [TOP]: { '/a': {}, '/d': {}, '/b': {}, '/b/c': {} }
    })
  })

})


