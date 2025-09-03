"use strict";
/* Copyright (c) 2021-2025 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const memfs_1 = require("memfs");
const jsonic_1 = require("jsonic");
const multisource_1 = require("../dist/multisource");
// import { makeJavaScriptProcessor } from '../dist/processor/js'
const mem_1 = require("../dist/resolver/mem");
const file_1 = require("../dist/resolver/file");
const pkg_1 = require("../dist/resolver/pkg");
const path_1 = require("@jsonic/path");
(0, node_test_1.describe)('multisource', () => {
    (0, node_test_1.test)('happy', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({
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
        };
        const j = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, o);
        (0, code_1.expect)(j('a:@a.jsonic,x:1')).equal({ a: { a: 1 }, x: 1 });
        (0, code_1.expect)(j('b:@b.jsc,x:1')).equal({ b: { b: 2 }, x: 1 });
        (0, code_1.expect)(j('c:@c.txt,x:1')).equal({ c: 'CCC', x: 1 });
        (0, code_1.expect)(j('d:@d.json,x:1')).equal({ d: { d: 3 }, x: 1 });
        // expect(j('e:@e.js,x:1')).equal({ e: { e: 4 }, x: 1 })
        (0, code_1.expect)(j('f:@f,x:1')).equal({ f: { f: 5 }, x: 1 });
        (0, code_1.expect)(j('g:@g,x:1')).equal({ g: { g: 6 }, x: 1 });
        (0, code_1.expect)(j('h:@h,x:1')).equal({ h: { h: 7 }, x: 1 });
        (0, code_1.expect)(j(`
  x:a:@a.jsonic 
  x:b:@b.jsc 
  x:c:@c.txt 
  x:d:@d.json 
  // x:e:@e.js 
  y:1
  `)).equal({
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
        });
    });
    (0, node_test_1.test)('pair-val', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({
                'a.jsonic': 'a:1',
            }),
        };
        const j = jsonic_1.Jsonic.make()
            // .use(Debug, { trace: true })
            .use(multisource_1.MultiSource, o);
        (0, code_1.expect)(j('{x:@a.jsonic}')).equal({ x: { a: 1 } });
        (0, code_1.expect)(j('x:@a.jsonic')).equal({ x: { a: 1 } });
        (0, code_1.expect)(j('{x:@a.jsonic y:1}')).equal({ x: { a: 1 }, y: 1 });
        (0, code_1.expect)(j('x:@a.jsonic y:1')).equal({ x: { a: 1 }, y: 1 });
        (0, code_1.expect)(j('{z:2 x:@a.jsonic y:1}')).equal({ z: 2, x: { a: 1 }, y: 1 });
        (0, code_1.expect)(j('z:2 x:@a.jsonic y:1')).equal({ z: 2, x: { a: 1 }, y: 1 });
        (0, code_1.expect)(j('{x:y:@a.jsonic}')).equal({ x: { y: { a: 1 } } });
        (0, code_1.expect)(j('x:y:@a.jsonic')).equal({ x: { y: { a: 1 } } });
        (0, code_1.expect)(j('{x:y:2 @a.jsonic}')).equal({ x: { y: 2 }, a: 1 });
        (0, code_1.expect)(j('x:y:2 @a.jsonic')).equal({ x: { y: 2 }, a: 1 });
        (0, code_1.expect)(j('x:2 @a.jsonic')).equal({ x: 2, a: 1 });
    });
    (0, node_test_1.test)('implicit', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({
                'a.jsonic': 'a:1',
                'b.jsonic': 'a:{b:1,c:2}',
                'd.jsonic': 'd:3',
            }),
        };
        const j = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, o);
        (0, code_1.expect)(j('a:@a.jsonic,x:1')).equal({ a: { a: 1 }, x: 1 });
        (0, code_1.expect)(j('[@a.jsonic,{x:1}]')).equal([{ a: 1 }, { x: 1 }]);
        (0, code_1.expect)(j('@a.jsonic')).equal({ a: 1 });
        (0, code_1.expect)(j('b:2 @a.jsonic')).equal({ b: 2, a: 1 });
        (0, code_1.expect)(j('b:2 @a.jsonic c:3')).equal({ b: 2, a: 1, c: 3 });
        (0, code_1.expect)(j('@a.jsonic b:2')).equal({ a: 1, b: 2 });
        (0, code_1.expect)(j('y:@b.jsonic,x:1')).equal({ y: { a: { b: 1, c: 2 } }, x: 1 });
        (0, code_1.expect)(j('@b.jsonic')).equal({ a: { b: 1, c: 2 } });
        (0, code_1.expect)(j('x:2 @b.jsonic')).equal({ x: 2, a: { b: 1, c: 2 } });
        (0, code_1.expect)(j('x:2 @b.jsonic y:3')).equal({ x: 2, a: { b: 1, c: 2 }, y: 3 });
        (0, code_1.expect)(j('@b.jsonic y:2')).equal({ a: { b: 1, c: 2 }, y: 2 });
        (0, code_1.expect)(j('a:{d:3} @b.jsonic')).equal({ a: { b: 1, c: 2, d: 3 } });
        (0, code_1.expect)(j('a:{d:3} @b.jsonic y:2')).equal({
            a: { b: 1, c: 2, d: 3 },
            y: 2,
        });
        (0, code_1.expect)(j('a:{d:3} @b.jsonic a:{d:4,f:5}')).equal({
            a: { b: 1, c: 2, d: 4, f: 5 },
        });
        (0, code_1.expect)(j('@b.jsonic a:{d:4,f:5}')).equal({
            a: { b: 1, c: 2, d: 4, f: 5 },
        });
        (0, code_1.expect)(j('a:{d:3} @b.jsonic a:{d:4,f:5} z:1')).equal({
            a: { b: 1, c: 2, d: 4, f: 5 },
            z: 1,
        });
        (0, code_1.expect)(j('@b.jsonic a:{d:4,f:5} z:1')).equal({
            a: { b: 1, c: 2, d: 4, f: 5 },
            z: 1,
        });
        (0, code_1.expect)(j('@a.jsonic @d.jsonic')).equal({
            a: 1,
            d: 3,
        });
        (0, code_1.expect)(j('x:11 @a.jsonic @d.jsonic')).equal({
            x: 11,
            a: 1,
            d: 3,
        });
        (0, code_1.expect)(j('@a.jsonic x:11 @d.jsonic')).equal({
            x: 11,
            a: 1,
            d: 3,
        });
        (0, code_1.expect)(j('x:{} @a.jsonic @d.jsonic')).equal({
            x: {},
            a: 1,
            d: 3,
        });
        (0, code_1.expect)(j('x:y:{} @a.jsonic @d.jsonic')).equal({
            x: { y: {} },
            a: 1,
            d: 3,
        });
    });
    (0, node_test_1.test)('deps', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({
                'a.jsc': 'a:1,b:@b.jsc,x:99',
                'b.jsc': 'b:2,c:@c',
                'c/index.jsc': 'c:3',
            }),
        };
        const j = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, o);
        (0, code_1.expect)(j('@a')).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 });
        (0, code_1.expect)(j('@a', {})).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 });
        (0, code_1.expect)(j('@a', { x: 1 })).equal({ a: 1, b: { b: 2, c: { c: 3 } }, x: 99 });
        (0, code_1.expect)(j('@a', { multisource: { path: undefined } })).equal({
            a: 1,
            b: { b: 2, c: { c: 3 } },
            x: 99,
        });
    });
    (0, node_test_1.test)('error-basic', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({}),
        };
        const j = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, o);
        // j('x:@a')
        (0, code_1.expect)(() => j('x:@a')).throws(/multisource_not_found.*:1:3/s);
        (0, code_1.expect)(() => j('x:@a', { fileName: 'foo' })).throws(/foo:1:3/s);
    });
    (0, node_test_1.test)('error-file', () => {
        const o = {
            resolver: (0, file_1.makeFileResolver)(),
        };
        const j = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, o);
        (0, code_1.expect)(() => j('@../test/e02.jsonic', { multisource: { path: __dirname } })).throws(/e02\.jsonic:2:3/);
        let deps = {};
        try {
            j('@../test/e01.jsonic', { multisource: { path: __dirname, deps } });
        }
        catch (e) {
            // console.log(e)
            // console.dir(e.meta.multisource, { depth: null })
            (0, code_1.expect)(e.message).match(/e02\.jsonic:2:3/);
            (0, code_1.expect)(e.meta.multisource.path).match(/e02\.jsonic/);
            (0, code_1.expect)(e.meta.multisource.parents[1]).match(/e01\.jsonic/);
        }
    });
    (0, node_test_1.test)('basic-file', () => {
        let j0 = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, {
            resolver: (0, file_1.makeFileResolver)(),
        });
        let deps = {};
        (0, code_1.expect)(j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname, deps } })).equal({ a: 1, b: { c: 2 } });
        // console.dir(deps, { depth: null })
        (0, code_1.expect)(j0('a:1,b:@"../test/t01.jsonic"', { multisource: { path: __dirname } })).equal({ a: 1, b: { c: 2 } });
        (0, code_1.expect)(j0('@"../test/t01.jsonic"', { multisource: { path: __dirname } })).equal({ c: 2 });
        (0, code_1.expect)(j0('a:1,@"../test/t01.jsonic"', { multisource: { path: __dirname } })).equal({ a: 1, c: 2 });
        (0, code_1.expect)(j0('@"../test/t01.jsonic",a:1', { multisource: { path: __dirname } })).equal({ a: 1, c: 2 });
        (0, code_1.expect)(j0('a:1,@"../test/t01.jsonic",b:2', { multisource: { path: __dirname } })).equal({ a: 1, c: 2, b: 2 });
        (0, code_1.expect)(j0('a:1,@"../test/t01.jsonic",b:2,@"../test/t01.jsonic",', { multisource: { path: __dirname } })).equal({ a: 1, c: 2, b: 2 });
        (0, code_1.expect)(() => j0('a:1,b:@"../test/t01.jsonic"', { multisource: {} })).throws(/not found/);
        (0, code_1.expect)(() => j0('a:1,b:@"../test/t01.jsonic"', {})).throws(/not found/);
        (0, code_1.expect)(() => j0('a:1,b:@"../test/t01.jsonic"')).throws(/not found/);
        deps = {};
        (0, code_1.expect)(j0('a:1,b:@"../test/t02.jsonic",c:3', {
            multisource: { path: __dirname, deps },
        })).equal({ a: 1, b: { d: 2, e: { f: 4 }, g: 9 }, c: 3 });
    });
    (0, node_test_1.test)('file-kind', () => {
        let j0 = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, {
            resolver: (0, file_1.makeFileResolver)(),
        });
        let deps = {};
        (0, code_1.expect)(j0('a:1,b:@"../test/k01.jsonic"', { multisource: { path: __dirname, deps } })).equal({ a: 1, b: { c: 2 } });
        // console.dir(deps, { depth: null })
        deps = {};
        (0, code_1.expect)(j0('a:1,d:@"../test/k02.js"', { multisource: { path: __dirname, deps } })).equal({ a: 1, d: { e: 3 } });
        deps = {};
        (0, code_1.expect)(j0('a:1,f:@"../test/k03.json"', { multisource: { path: __dirname, deps } })).equal({ a: 1, f: { g: 4 } });
        deps = {};
        (0, code_1.expect)(j0('a:1,b:@"../test/k01.jsonic",d:@"../test/k02.js",f:@"../test/k03.json"', {
            multisource: { path: __dirname, deps },
        })).equal({ a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } });
        deps = {};
        (0, code_1.expect)(j0('@"../test/k04.jsc"', { multisource: { path: __dirname, deps } })).equal({ a: 1, b: { c: 2 }, d: { e: 3 }, f: { g: 4 } });
    });
    (0, node_test_1.test)('path', () => {
        const o = {
            resolver: (0, mem_1.makeMemResolver)({
                'x.jsonic': 'x:y:1',
            }),
            // processor: {
            //   js: makeJavaScriptProcessor({ evalOnly: true }),
            // },
        };
        const j = jsonic_1.Jsonic.make()
            .use(multisource_1.MultiSource, o)
            .use(path_1.Path)
            .use((jsonic) => {
            jsonic.rule('val', (rs) => {
                rs.ac(false, (r) => {
                    if ('object' === typeof r.node) {
                        r.node.$ = `${r.k.path}`;
                    }
                });
            });
        });
        (0, code_1.expect)(j('a:b:@"x.jsonic"')).equal({
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
        });
    });
    (0, node_test_1.test)('memfs', () => {
        const j0 = jsonic_1.Jsonic.make()
            .use(multisource_1.MultiSource, {
            resolver: (0, file_1.makeFileResolver)()
        });
        const { fs, vol } = (0, memfs_1.memfs)({
            'b.jsonic': '2',
            node_modules: {
                foo: {
                    'c.jsonic': '3'
                }
            }
        });
        //      ; (fs as any).ISMEM = true
        (0, code_1.expect)(j0('a:1 b:@"/b.jsonic"', { fs })).equal({
            a: 1, b: 2
        });
        (0, code_1.expect)(j0('a:1 b:@"b.jsonic"', { fs, multisource: { path: '/' } })).equal({
            a: 1, b: 2
        });
        const j1 = jsonic_1.Jsonic.make()
            .use(multisource_1.MultiSource, {
            resolver: (0, pkg_1.makePkgResolver)({ require })
        });
        (0, code_1.expect)(j1('a:1 c:@"jsonic-multisource-pkg-test/zed.jsonic"', { fs, multisource: { path: '/' } }))
            .equal({
            a: 1, c: { zed: 99 }
        });
        // TODO: implement require over virtual fs
        // expect(j1('a:1 c:@"foo/c.jsonic"', { fs, multisource: { path: '/' } })).equal({
        //   a: 1, c: 3
        // })
    });
});
//# sourceMappingURL=multisource.test.js.map