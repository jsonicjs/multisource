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

  it('happy', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeMemResolver({
        '/a': 'b:1',
      }),
    })

    expect(j0('c:1')).equals({ c: 1 })
    expect(j0('c:@"/a"')).equals({ c: { b: 1 } })
    expect(j0('x:y:1, x:z:2')).equals({ x: { y: 1, z: 2 } })

  })


  it('file', () => {
    let r0 = makeFileResolver()
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: r0,
    })

    let deps = {}
    expect(j0('a:1,b:@"./t01.jsonic"', { multisource: { path: __dirname, deps } }))
      .equals({ a: 1, b: { c: 2 } })
    //console.dir(deps, { depth: null })

    deps = {}
    expect(j0('a:1,b:@"./t02.jsonic",c:3', { multisource: { path: __dirname, deps } }))
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
    expect(remove(deps, 'wen')).equal({
      '/b/c': { '/a': { tar: '/b/c', src: '/a' } },
      '/b': { '/b/c': { tar: '/b', src: '/b/c' } },
      [TOP]: {
        '/a': { tar: TOP, src: '/a' },
        '/d': { tar: TOP, src: '/d' },
        '/b': { tar: TOP, src: '/b' },
        '/b/c': { tar: TOP, src: '/b/c' }
      }
    })
  })

})


function remove(o: any, k: string) {
  if (null != o && 'object' === typeof (o)) {
    delete o[k]
    remove(o[TOP], k)
    for (let p in o) {
      remove(o[p], k)
    }
  }
  return o
}
