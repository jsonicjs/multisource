/* Copyright (c) 2021-2025 Richard Rodger and other contributors, MIT License */

import { test, describe } from 'node:test'
import assert from 'node:assert'

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

    assert.deepEqual(j('a:@a.jsonic,x:1'), { a: { a: 1 }, x: 1 })
    assert.deepEqual(j('b:@b.jsc,x:1'), { b: { b: 2 }, x: 1 })
    assert.deepEqual(j('c:@c.txt,x:1'), { c: 'CCC', x: 1 })
    assert.deepEqual(j('d:@d.json,x:1'), { d: { d: 3 }, x: 1 })
    // assert.deepEqual(j('e:@e.js,x:1'), { e: { e: 4 }, x: 1 })
    assert.deepEqual(j('f:@f,x:1'), { f: { f: 5 }, x: 1 })
    assert.deepEqual(j('g:@g,x:1'), { g: { g: 6 }, x: 1 })
    assert.deepEqual(j('h:@h,x:1'), { h: { h: 7 }, x: 1 })

    assert.deepEqual(
      j(`
  x:a:@a.jsonic 
  x:b:@b.jsc 
  x:c:@c.txt 
  x:d:@d.json 
  // x:e:@e.js 
  y:1
  `)
    , {
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


    assert.deepEqual(j('{x:@a.jsonic}'), { x: { a: 1 } })
    assert.deepEqual(j('x:@a.jsonic'), { x: { a: 1 } })

    assert.deepEqual(j('{x:@a.jsonic y:1}'), { x: { a: 1 }, y: 1 })
    assert.deepEqual(j('x:@a.jsonic y:1'), { x: { a: 1 }, y: 1 })

    assert.deepEqual(j('{z:2 x:@a.jsonic y:1}'), { z: 2, x: { a: 1 }, y: 1 })
    assert.deepEqual(j('z:2 x:@a.jsonic y:1'), { z: 2, x: { a: 1 }, y: 1 })

    assert.deepEqual(j('{x:y:@a.jsonic}'), { x: { y: { a: 1 } } })
    assert.deepEqual(j('x:y:@a.jsonic'), { x: { y: { a: 1 } } })

    assert.deepEqual(j('{x:y:2 @a.jsonic}'), { x: { y: 2 }, a: 1 })
    assert.deepEqual(j('x:y:2 @a.jsonic'), { x: { y: 2 }, a: 1 })

    assert.deepEqual(j('x:2 @a.jsonic'), { x: 2, a: 1 })
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

    assert.deepEqual(j('a:@a.jsonic,x:1'), { a: { a: 1 }, x: 1 })
    assert.deepEqual(j('[@a.jsonic,{x:1}]'), [{ a: 1 }, { x: 1 }])

    assert.deepEqual(j('@a.jsonic'), { a: 1 })
    assert.deepEqual(j('b:2 @a.jsonic'), { b: 2, a: 1 })
    assert.deepEqual(j('b:2 @a.jsonic c:3'), { b: 2, a: 1, c: 3 })
    assert.deepEqual(j('@a.jsonic b:2'), { a: 1, b: 2 })

    assert.deepEqual(j('y:@b.jsonic,x:1'), { y: { a: { b: 1, c: 2 } }, x: 1 })
    assert.deepEqual(j('@b.jsonic'), { a: { b: 1, c: 2 } })
    assert.deepEqual(j('x:2 @b.jsonic'), { x: 2, a: { b: 1, c: 2 } })
    assert.deepEqual(j('x:2 @b.jsonic y:3'), { x: 2, a: { b: 1, c: 2 }, y: 3 })
    assert.deepEqual(j('@b.jsonic y:2'), { a: { b: 1, c: 2 }, y: 2 })

    assert.deepEqual(j('a:{d:3} @b.jsonic'), { a: { b: 1, c: 2, d: 3 } })
    assert.deepEqual(j('a:{d:3} @b.jsonic y:2'), {
      a: { b: 1, c: 2, d: 3 },
      y: 2,
    })

    assert.deepEqual(j('a:{d:3} @b.jsonic a:{d:4,f:5}'), {
      a: { b: 1, c: 2, d: 4, f: 5 },
    })
    assert.deepEqual(j('@b.jsonic a:{d:4,f:5}'), {
      a: { b: 1, c: 2, d: 4, f: 5 },
    })

    assert.deepEqual(j('a:{d:3} @b.jsonic a:{d:4,f:5} z:1'), {
      a: { b: 1, c: 2, d: 4, f: 5 },
      z: 1,
    })
    assert.deepEqual(j('@b.jsonic a:{d:4,f:5} z:1'), {
      a: { b: 1, c: 2, d: 4, f: 5 },
      z: 1,
    })

    assert.deepEqual(j('@a.jsonic @d.jsonic'), {
      a: 1,
      d: 3,
    })

    assert.deepEqual(j('x:11 @a.jsonic @d.jsonic'), {
      x: 11,
      a: 1,
      d: 3,
    })
    assert.deepEqual(j('@a.jsonic x:11 @d.jsonic'), {
      x: 11,
      a: 1,
      d: 3,
    })

    assert.deepEqual(j('x:{} @a.jsonic @d.jsonic'), {
      x: {},
      a: 1,
      d: 3,
    })
    assert.deepEqual(j('x:y:{} @a.jsonic @d.jsonic'), {
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

    assert.deepEqual(j('@a'), { a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })

    assert.deepEqual(j('@a', {}), { a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    assert.deepEqual(j('@a', { x: 1 }), { a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    assert.deepEqual(j('@a', { multisource: { path: undefined } }), {
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
    assert.throws(() => j('x:@a'), /multisource_not_found.*:1:3/s)

    assert.throws(() => j('x:@a', { fileName: 'foo' }), /foo:1:3/s)
  })


  test('error-file', () => {
    const o: MultiSourceOptions = {
      resolver: makeFileResolver(),
    }
    const j = Jsonic.make().use(MultiSource, o)

    assert.throws(() =>
      j('@../test/e02.jsonic', { multisource: { path: __dirname } })
    , /e02\.jsonic:2:3/)

    let deps = {}
    try {
      j('@../test/e01.jsonic', { multisource: { path: __dirname, deps } })
    }
    catch (e: any) {
      // console.log(e)
      // console.dir(e.meta.multisource, { depth: null })
      assert.match(e.message, /e02\.jsonic:2:3/)
      assert.match(e.meta.multisource.path, /e02\.jsonic/)
      assert.match(e.meta.multisource.parents[1], /e01\.jsonic/)
    }
  })


  test('basic-file', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    let deps = {}
    assert.deepEqual(
      j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname, deps } })
    , { a: 1, b: { c: 2 } })
    // console.dir(deps, { depth: null })

    assert.deepEqual(
      j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname } })
    , { a: 1, b: { c: 2 } })


    assert.deepEqual(
      j0('@"../test/t01.jsonic"', { multisource: { path: __dirname } })
    , { c: 2 })

    assert.deepEqual(
      j0('a:1,@"../test/t01.jsonic"', { multisource: { path: __dirname } })
    , { a: 1, c: 2 })

    assert.deepEqual(
      j0('@"../test/t01.jsonic",a:1', { multisource: { path: __dirname } })
    , { a: 1, c: 2 })

    assert.deepEqual(
      j0('a:1,@"../test/t01.jsonic",b:2', { multisource: { path: __dirname } })
    , { a: 1, c: 2, b: 2 })

    assert.deepEqual(
      j0('a:1,@"../test/t01.jsonic",b:2,@"../test/t01.jsonic",',
        { multisource: { path: __dirname } })
    , { a: 1, c: 2, b: 2 })


    assert.throws(() => j0('a:1,b:@"../test/t01.jsonic"', { multisource: {} }), 
      /not found/,
    )

    assert.throws(() => j0('a:1,b:@"../test/t01.jsonic"', {}), /not found/)

    assert.throws(() => j0('a:1,b:@"../test/t01.jsonic"'), /not found/)

    deps = {}
    assert.deepEqual(
      j0('a:1,b:@"../test/t02.jsonic",c:3', {
        multisource: { path: __dirname, deps },
      })
    , { a: 1, b: { d: 2, e: { f: 4 }, g: 9 }, c: 3 })
  })


  test('file-kind', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    let deps = {}
    assert.deepEqual(
      j0('a:1,b:@"../test/k01.jsonic"', { multisource: { path: __dirname, deps } })
    , { a: 1, b: { c: 2 } })
    // console.dir(deps, { depth: null })

    deps = {}
    assert.deepEqual(
      j0('a:1,d:@"../test/k02.js"', { multisource: { path: __dirname, deps } })
    , { a: 1, d: { e: 3 } })

    deps = {}
    assert.deepEqual(
      j0('a:1,f:@"../test/k03.json"', { multisource: { path: __dirname, deps } })
    , { a: 1, f: { g: 4 } })

    deps = {}
    assert.deepEqual(
      j0('a:1,b:@"../test/k01.jsonic",d:@"../test/k02.js",f:@"../test/k03.json"', {
        multisource: { path: __dirname, deps },
      })
    , { a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } })

    deps = {}
    assert.deepEqual(
      j0('@"../test/k04.jsc"', { multisource: { path: __dirname, deps } })
    , { a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } })
  })


  test('custom-ext', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
      processor: {
        foo: 'jsonic'
      }
    })

    let deps = {}
    assert.deepEqual(
      j0('@"../test/t04.foo"', { multisource: { path: __dirname, deps } })
    , { a: 1 })
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

    assert.deepEqual(j('a:b:@"x.jsonic"'), {
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

    assert.deepEqual(j0('a:1 b:@"/b.jsonic"', { fs }), {
      a: 1, b: 2
    })

    assert.deepEqual(j0('a:1 b:@"b.jsonic"', { fs, multisource: { path: '/' } }), {
      a: 1, b: 2
    })


    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    assert.deepEqual(j1('a:1 c:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { fs, multisource: { path: '/' } }), {
        a: 1, c: { zed: 99 }
      })

    // TODO: implement require over virtual fs
    // assert.deepEqual(j1('a:1 c:@"foo/c.jsonic"', { fs, multisource: { path: '/' } }), {
    //   a: 1, c: 3
    // })
  })


  test('pkg-require-array', () => {
    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({
          require: [__dirname + '/..']
        })
      })

    assert.deepEqual(j1('a:1 c:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { multisource: { path: '/' } }), { a: 1, c: { zed: 99 } })
  })


  test('pkg-require-string', () => {
    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({
          require: __dirname + '/..'
        })
      })

    assert.deepEqual(j1('a:1 c:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { multisource: { path: '/' } }), { a: 1, c: { zed: 99 } })
  })


  test('pkg-virtual-fs-fallback', () => {
    const { fs } = memfs({
      'data.jsonic': 'data:42',
    })

    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    assert.deepEqual(j1('a:1 d:@"/data.jsonic"',
      { fs, multisource: { path: '/' } }), { a: 1, d: { data: 42 } })
  })


  test('pkg-no-path', () => {
    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    assert.deepEqual(j1('z:@"jsonic-multisource-pkg-test"'), { z: 11 })
  })


  test('pkg-resolvefolder-file', () => {
    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    // multisource path is a file, not a directory - tests resolvefolder isFile branch
    const filePath = __dirname + '/../package.json'
    assert.deepEqual(j1('z:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { multisource: { path: filePath } }), { z: { zed: 99 } })
  })


  test('pkg-fs-error', () => {
    const brokenFs: any = {
      existsSync: () => { throw new Error('broken') },
      readFileSync: () => Buffer.from(''),
      statSync: () => ({ isFile: () => false }),
    }

    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    assert.throws(() => j1('x:@"/nonexistent.jsonic"',
      { fs: brokenFs, multisource: { path: '/' } }), /not_found/)
  })


  test('pkg-load-failure', () => {
    const errorFs: any = {
      existsSync: (p: string) => p.endsWith('/data.jsonic'),
      readFileSync: () => { throw new Error('read error') },
      statSync: () => ({ isFile: () => false }),
    }

    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({ require })
      })

    // existsSync returns true but readFileSync throws - covers load catch
    assert.throws(() => j1('x:@"/data.jsonic"',
      { fs: errorFs, multisource: { path: '/' } }), /not_found/)
  })


  test('pkg-node-modules-walk', () => {
    const j1 = Jsonic.make()
      .use(MultiSource, {
        resolver: makePkgResolver({
          require: ['/nonexistent']
        })
      })

    // Initial require.resolve fails with bad paths,
    // then node_modules walk (no virtual fs) finds the package
    assert.deepEqual(j1('z:@"jsonic-multisource-pkg-test/zed.jsonic"',
      { multisource: { path: process.cwd() } }), { z: { zed: 99 } })
  })


  test('file-implicit', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    // File without extension - found via implicit extension and potentials loop
    assert.deepEqual(
      j0('a:1,b:@"t01"',
        { multisource: { path: process.cwd() + '/test' } })
    , { a: 1, b: { c: 2 } })
  })


  test('file-pathfinder', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver((spec: any) => {
        return '../test/' + spec
      }),
    })

    assert.deepEqual(
      j0('b:@"t01.jsonic"', { multisource: { path: __dirname } })
    , { b: { c: 2 } })
  })


  test('spec-object', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
      }),
    }
    const j = Jsonic.make().use(MultiSource, o)

    // spec as object with path property - covers resolvePathSpec spec.path branch
    assert.deepEqual(j('x:@{path:"a.jsonic"}'), { x: { a: 1 } })
  })


  test('merge', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
      }),
    }
    const j = Jsonic.make()
      .use(MultiSource, o)

    j.options({
      map: {
        merge: (prev: any, curr: any) => Object.assign({}, prev, curr)
      }
    })

    assert.deepEqual(j('x:2 @a.jsonic'), { x: 2, a: 1 })
  })


  test('assign', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
      }),
    }
    const j = Jsonic.make()
      .use(MultiSource, o)

    j.options({
      map: {
        extend: false as any
      }
    })

    assert.deepEqual(j('x:2 @a.jsonic'), { x: 2, a: 1 })
  })


  test('js-default-export', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    // JS module with exports.default - tests the out.default branch in js.ts
    let deps = {}
    assert.deepEqual(
      j0('a:1,d:@"../test/k05.js"', { multisource: { path: __dirname, deps } })
    , { a: 1, d: { f: 5 } })
  })


  test('jsonic-null-src', () => {
    const o: MultiSourceOptions = {
      resolver: (_spec: any, _popts: any, _rule: any, _ctx: any) => ({
        kind: 'jsonic',
        abs: false,
        found: true,
        src: undefined,
        full: undefined,
      }),
    }
    const j = Jsonic.make().use(MultiSource, o)

    // Covers the null src/full guard in jsonic processor
    assert.deepEqual(j('x:@"foo"'), { x: null })
  })

})
