/* Copyright (c) 2021-2025 Richard Rodger and other contributors, MIT License */

import { test, describe } from 'node:test'
import { expect } from '@hapi/code'

import { memfs } from 'memfs'

import { Jsonic } from 'jsonic'
import { Debug } from 'jsonic/debug'
import { MultiSource, MultiSourceOptions } from '../dist/multisource'
// import { makeJavaScriptProcessor } from '../dist/processor/js'
import { makeMemResolver } from '../dist/resolver/mem'
import { makeFileResolver } from '../dist/resolver/file'
import { makePkgResolver } from '../dist/resolver/pkg'
import { Path } from '@jsonic/path'


describe('multisource', () => {
  test('happy', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
        'b.jsc': 'b:2',
        'c.txt': 'CCC',
        'd.json': '{"d":3}',
        // 'e.js': 'module.exports={e:4}',
        'f.jsc': 'f:5',
        'g/index.jsc': 'g:6',
        'h/index.h.jsc': 'h:7',
      }),
      // processor: {
      //   js: makeJavaScriptProcessor({ evalOnly: true }),
      // },
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(j('a:@a.jsonic,x:1')).equal({ a: { a: 1 }, x: 1 })
    expect(j('b:@b.jsc,x:1')).equal({ b: { b: 2 }, x: 1 })
    expect(j('c:@c.txt,x:1')).equal({ c: 'CCC', x: 1 })
    expect(j('d:@d.json,x:1')).equal({ d: { d: 3 }, x: 1 })
    // expect(j('e:@e.js,x:1')).equal({ e: { e: 4 }, x: 1 })
    expect(j('f:@f,x:1')).equal({ f: { f: 5 }, x: 1 })
    expect(j('g:@g,x:1')).equal({ g: { g: 6 }, x: 1 })
    expect(j('h:@h,x:1')).equal({ h: { h: 7 }, x: 1 })

    expect(
      j(`
  x:a:@a.jsonic 
  x:b:@b.jsc 
  x:c:@c.txt 
  x:d:@d.json 
  // x:e:@e.js 
  y:1
  `),
    ).equal({
      x: {
        a: {
          a: 1,
        },
        b: {
          b: 2,
        },
        c: 'CCC',
        d: {
          d: 3,
        },
        // e: {
        //   e: 4,
        // },
      },
      y: 1,
    })
  })


  test('pair-val', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
      }),
    }
    const j = Jsonic.make()
      // .use(Debug, { trace: true })
      .use(MultiSource, o)


    expect(j('{x:@a.jsonic}')).equal({ x: { a: 1 } })
    expect(j('x:@a.jsonic')).equal({ x: { a: 1 } })

    expect(j('{x:@a.jsonic y:1}')).equal({ x: { a: 1 }, y: 1 })
    expect(j('x:@a.jsonic y:1')).equal({ x: { a: 1 }, y: 1 })

    expect(j('{z:2 x:@a.jsonic y:1}')).equal({ z: 2, x: { a: 1 }, y: 1 })
    expect(j('z:2 x:@a.jsonic y:1')).equal({ z: 2, x: { a: 1 }, y: 1 })

    expect(j('{x:y:@a.jsonic}')).equal({ x: { y: { a: 1 } } })
    expect(j('x:y:@a.jsonic')).equal({ x: { y: { a: 1 } } })

    expect(j('{x:y:2 @a.jsonic}')).equal({ x: { y: 2 }, a: 1 })
    expect(j('x:y:2 @a.jsonic')).equal({ x: { y: 2 }, a: 1 })

    expect(j('x:2 @a.jsonic')).equal({ x: 2, a: 1 })
  })



  test('implicit', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
        'b.jsonic': 'a:{b:1,c:2}',
        'd.jsonic': 'd:3',
      }),
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(j('a:@a.jsonic,x:1')).equal({ a: { a: 1 }, x: 1 })
    expect(j('[@a.jsonic,{x:1}]')).equal([{ a: 1 }, { x: 1 }])

    expect(j('@a.jsonic')).equal({ a: 1 })
    expect(j('b:2 @a.jsonic')).equal({ b: 2, a: 1 })
    expect(j('b:2 @a.jsonic c:3')).equal({ b: 2, a: 1, c: 3 })
    expect(j('@a.jsonic b:2')).equal({ a: 1, b: 2 })

    expect(j('y:@b.jsonic,x:1')).equal({ y: { a: { b: 1, c: 2 } }, x: 1 })
    expect(j('@b.jsonic')).equal({ a: { b: 1, c: 2 } })
    expect(j('x:2 @b.jsonic')).equal({ x: 2, a: { b: 1, c: 2 } })
    expect(j('x:2 @b.jsonic y:3')).equal({ x: 2, a: { b: 1, c: 2 }, y: 3 })
    expect(j('@b.jsonic y:2')).equal({ a: { b: 1, c: 2 }, y: 2 })

    expect(j('a:{d:3} @b.jsonic')).equal({ a: { b: 1, c: 2, d: 3 } })
    expect(j('a:{d:3} @b.jsonic y:2')).equal({
      a: { b: 1, c: 2, d: 3 },
      y: 2,
    })

    expect(j('a:{d:3} @b.jsonic a:{d:4,f:5}')).equal({
      a: { b: 1, c: 2, d: 4, f: 5 },
    })
    expect(j('@b.jsonic a:{d:4,f:5}')).equal({
      a: { b: 1, c: 2, d: 4, f: 5 },
    })

    expect(j('a:{d:3} @b.jsonic a:{d:4,f:5} z:1')).equal({
      a: { b: 1, c: 2, d: 4, f: 5 },
      z: 1,
    })
    expect(j('@b.jsonic a:{d:4,f:5} z:1')).equal({
      a: { b: 1, c: 2, d: 4, f: 5 },
      z: 1,
    })

    expect(j('@a.jsonic @d.jsonic')).equal({
      a: 1,
      d: 3,
    })

    expect(j('x:11 @a.jsonic @d.jsonic')).equal({
      x: 11,
      a: 1,
      d: 3,
    })
    expect(j('@a.jsonic x:11 @d.jsonic')).equal({
      x: 11,
      a: 1,
      d: 3,
    })

    expect(j('x:{} @a.jsonic @d.jsonic')).equal({
      x: {},
      a: 1,
      d: 3,
    })
    expect(j('x:y:{} @a.jsonic @d.jsonic')).equal({
      x: { y: {} },
      a: 1,
      d: 3,
    })

  })

  test('deps', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsc': 'a:1,b:@b.jsc,x:99',
        'b.jsc': 'b:2,c:@c',
        'c/index.jsc': 'c:3',
      }),
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(j('@a')).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })

    expect(j('@a', {})).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    expect(j('@a', { x: 1 })).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    expect(j('@a', { multisource: { path: undefined } })).equal({
      a: 1,
      b: { b: 2, c: { c: 3 } },
      x: 99,
    })
  })


  test('error-basic', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({}),
    }
    const j = Jsonic.make().use(MultiSource, o)

    // j('x:@a')
    expect(() => j('x:@a')).throws(/multisource_not_found.*:1:3/s)

    expect(() => j('x:@a', { fileName: 'foo' })).throws(/foo:1:3/s)
  })


  test('error-file', () => {
    const o: MultiSourceOptions = {
      resolver: makeFileResolver(),
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(() =>
      j('@../test/e02.jsonic', { multisource: { path: __dirname } }),
    ).throws(/e02\.jsonic:2:3/)

    let deps = {}
    try {
      j('@../test/e01.jsonic', { multisource: { path: __dirname, deps } })
    }
    catch (e: any) {
      // console.log(e)
      // console.dir(e.meta.multisource, { depth: null })
      expect(e.message).match(/e02\.jsonic:2:3/)
      expect(e.meta.multisource.path).match(/e02\.jsonic/)
      expect(e.meta.multisource.parents[1]).match(/e01\.jsonic/)
    }
  })


  test('basic-file', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    let deps = {}
    expect(
      j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname, deps } }),
    ).equal({ a: 1, b: { c: 2 } })
    // console.dir(deps, { depth: null })

    expect(
      j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname } }),
    ).equal({ a: 1, b: { c: 2 } })


    expect(
      j0('@"../test/t01.jsonic"', { multisource: { path: __dirname } }),
    ).equal({ c: 2 })

    expect(
      j0('a:1,@"../test/t01.jsonic"', { multisource: { path: __dirname } }),
    ).equal({ a: 1, c: 2 })

    expect(
      j0('@"../test/t01.jsonic",a:1', { multisource: { path: __dirname } }),
    ).equal({ a: 1, c: 2 })

    expect(
      j0('a:1,@"../test/t01.jsonic",b:2', { multisource: { path: __dirname } }),
    ).equal({ a: 1, c: 2, b: 2 })

    expect(
      j0('a:1,@"../test/t01.jsonic",b:2,@"../test/t01.jsonic",',
        { multisource: { path: __dirname } }),
    ).equal({ a: 1, c: 2, b: 2 })


    expect(() => j0('a:1,b:@"../test/t01.jsonic"', { multisource: {} })).throws(
      /not found/,
    )

    expect(() => j0('a:1,b:@"../test/t01.jsonic"', {})).throws(/not found/)

    expect(() => j0('a:1,b:@"../test/t01.jsonic"')).throws(/not found/)

    deps = {}
    expect(
      j0('a:1,b:@"../test/t02.jsonic",c:3', {
        multisource: { path: __dirname, deps },
      }),
    ).equal({ a: 1, b: { d: 2, e: { f: 4 }, g: 9 }, c: 3 })
  })


  test('file-kind', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    let deps = {}
    expect(
      j0('a:1,b:@"../test/k01.jsonic"', { multisource: { path: __dirname, deps } }),
    ).equal({ a: 1, b: { c: 2 } })
    // console.dir(deps, { depth: null })

    deps = {}
    expect(
      j0('a:1,d:@"../test/k02.js"', { multisource: { path: __dirname, deps } }),
    ).equal({ a: 1, d: { e: 3 } })

    deps = {}
    expect(
      j0('a:1,f:@"../test/k03.json"', { multisource: { path: __dirname, deps } }),
    ).equal({ a: 1, f: { g: 4 } })

    deps = {}
    expect(
      j0('a:1,b:@"../test/k01.jsonic",d:@"../test/k02.js",f:@"../test/k03.json"', {
        multisource: { path: __dirname, deps },
      }),
    ).equal({ a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } })

    deps = {}
    expect(
      j0('@"../test/k04.jsc"', { multisource: { path: __dirname, deps } }),
    ).equal({ a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } })
  })

  test('path', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'x.jsonic': 'x:y:1',
      }),
      // processor: {
      //   js: makeJavaScriptProcessor({ evalOnly: true }),
      // },
    }
    const j = Jsonic.make()
      .use(MultiSource, o)
      .use(Path)
      .use((jsonic) => {
        jsonic.rule('val', (rs) => {
          rs.ac(false, (r) => {
            if ('object' === typeof r.node) {
              r.node.$ = `${r.k.path}`
            }
          })
        })
      })

    expect(j('a:b:@"x.jsonic"')).equal({
      $: '',
      a: {
        $: 'a',
        b: {
          $: 'a,b',
          x: {
            $: 'a,b,x',
            y: 1,
          },
        },
      },
    })
  })


  test('memfs', () => {
    const j0 = Jsonic.make()
      .use(MultiSource, {
        resolver: makeFileResolver()
      })

    const { fs, vol } = memfs({
      'b.jsonic': '2',
      node_modules: {
        foo: {
          'c.jsonic': '3'
        }
      }
    })

    //      ; (fs as any).ISMEM = true

    expect(j0('a:1 b:@"/b.jsonic"', { fs })).equal({
      a: 1, b: 2
    })

    expect(j0('a:1 b:@"b.jsonic"', { fs, multisource: { path: '/' } })).equal({
      a: 1, b: 2
    })


    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    expect(j1('a:1 c:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { fs, multisource: { path: '/' } }))
      .equal({
        a: 1, c: { zed: 99 }
      })

    // TODO: implement require over virtual fs
    // expect(j1('a:1 c:@"foo/c.jsonic"', { fs, multisource: { path: '/' } })).equal({
    //   a: 1, c: 3
    // })
  })

})
