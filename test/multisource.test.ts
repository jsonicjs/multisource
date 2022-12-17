/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */

import { Jsonic } from '@jsonic/jsonic-next'
import { MultiSource, MultiSourceOptions } from '../src/multisource'
import { makeJavaScriptProcessor } from '../src/processor/js'
import { makeMemResolver } from '../src/resolver/mem'
import { makeFileResolver } from '../src/resolver/file'

describe('multisource', () => {
  test('happy', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
        'b.jsc': 'b:2',
        'c.txt': 'CCC',
        'd.json': '{"d":3}',
        'e.js': 'module.exports={e:4}',
        'f.jsc': 'f:5',
        'g/index.jsc': 'g:6',
        'h/index.h.jsc': 'h:7',
      }),
      processor: {
        js: makeJavaScriptProcessor({ evalOnly: true }),
      },
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(j('a:@a.jsonic,x:1')).toEqual({ a: { a: 1 }, x: 1 })
    expect(j('b:@b.jsc,x:1')).toEqual({ b: { b: 2 }, x: 1 })
    expect(j('c:@c.txt,x:1')).toEqual({ c: 'CCC', x: 1 })
    expect(j('d:@d.json,x:1')).toEqual({ d: { d: 3 }, x: 1 })
    expect(j('e:@e.js,x:1')).toEqual({ e: { e: 4 }, x: 1 })
    expect(j('f:@f,x:1')).toEqual({ f: { f: 5 }, x: 1 })
    expect(j('g:@g,x:1')).toEqual({ g: { g: 6 }, x: 1 })
    expect(j('h:@h,x:1')).toEqual({ h: { h: 7 }, x: 1 })

    expect(
      j(`
  x:a:@a.jsonic 
  x:b:@b.jsc 
  x:c:@c.txt 
  x:d:@d.json 
  x:e:@e.js 
  y:1
  `)
    ).toEqual({
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
        e: {
          e: 4,
        },
      },
      y: 1,
    })
  })


  test('implicit', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({
        'a.jsonic': 'a:1',
        'b.jsonic': 'a:{b:1,c:2}',
      }),
    }
    const j = Jsonic.make().use(MultiSource, o)

    expect(j('a:@a.jsonic,x:1')).toEqual({ a: { a: 1 }, x: 1 })
    expect(j('[@a.jsonic,{x:1}]')).toEqual([{ a: 1 }, { x: 1 }])

    expect(j('@a.jsonic')).toEqual({ a: 1 })
    expect(j('b:2 @a.jsonic')).toEqual({ b: 2, a: 1 })
    expect(j('b:2 @a.jsonic c:3')).toEqual({ b: 2, a: 1, c: 3 })
    expect(j('@a.jsonic b:2')).toEqual({ a: 1, b: 2 })

    expect(j('y:@b.jsonic,x:1')).toEqual({ y: { a: { b: 1, c: 2 } }, x: 1 })
    expect(j('@b.jsonic')).toEqual({ a: { b: 1, c: 2 } })
    expect(j('x:2 @b.jsonic')).toEqual({ x: 2, a: { b: 1, c: 2 } })
    expect(j('x:2 @b.jsonic y:3')).toEqual({ x: 2, a: { b: 1, c: 2 }, y: 3 })
    expect(j('@b.jsonic y:2')).toEqual({ a: { b: 1, c: 2 }, y: 2 })

    expect(j('a:{d:3} @b.jsonic')).toEqual({ a: { b: 1, c: 2, d: 3 } })
    expect(j('a:{d:3} @b.jsonic y:2')).toEqual({ a: { b: 1, c: 2, d: 3 }, y: 2 })

    expect(j('a:{d:3} @b.jsonic a:{d:4,f:5}'))
      .toEqual({ a: { b: 1, c: 2, d: 4, f: 5 } })
    expect(j('@b.jsonic a:{d:4,f:5}'))
      .toEqual({ a: { b: 1, c: 2, d: 4, f: 5 } })

    expect(j('a:{d:3} @b.jsonic a:{d:4,f:5} z:1'))
      .toEqual({ a: { b: 1, c: 2, d: 4, f: 5 }, z: 1 })
    expect(j('@b.jsonic a:{d:4,f:5} z:1'))
      .toEqual({ a: { b: 1, c: 2, d: 4, f: 5 }, z: 1 })

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

    expect(j('@a')).toEqual({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })

    expect(j('@a', {})).toEqual({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    expect(j('@a', { x: 1 })).toEqual({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 })
    expect(j('@a', { multisource: { path: undefined } })).toEqual({
      a: 1,
      b: { b: 2, c: { c: 3 } },
      x: 99,
    })
  })


  test('error', () => {
    const o: MultiSourceOptions = {
      resolver: makeMemResolver({}),
    }
    const j = Jsonic.make().use(MultiSource, o)

    // j('x:@a')
    expect(() => j('x:@a')).toThrow(/multisource_not_found.*:1:3/s)
  })


  it('file', () => {
    let j0 = Jsonic.make().use(MultiSource, {
      resolver: makeFileResolver(),
    })

    let deps = {}
    expect(
      j0('a:1,b:@"./t01.jsonic"', { multisource: { path: __dirname, deps } })
    ).toEqual({ a: 1, b: { c: 2 } })
    // console.dir(deps, { depth: null })

    expect(
      j0('a:1,b:@"./t01.jsonic"', { multisource: { path: __dirname } })
    ).toEqual({ a: 1, b: { c: 2 } })

    expect(() => j0('a:1,b:@"./t01.jsonic"', { multisource: {} })).toThrow(
      'not found'
    )

    expect(() => j0('a:1,b:@"./t01.jsonic"', {})).toThrow('not found')

    expect(() => j0('a:1,b:@"./t01.jsonic"')).toThrow('not found')

    deps = {}
    expect(
      j0('a:1,b:@"./t02.jsonic",c:3', {
        multisource: { path: __dirname, deps },
      })
    ).toEqual({ a: 1, b: { d: 2, e: { f: 4 } }, c: 3 })
  })
})
