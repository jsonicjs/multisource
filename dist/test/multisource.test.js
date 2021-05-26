"use strict";
/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lab_1 = __importDefault(require("@hapi/lab"));
const code_1 = __importDefault(require("@hapi/code"));
const lab = (exports.lab = lab_1.default.script());
const describe = lab.describe;
const it = lab.it;
const expect = code_1.default.expect;
const jsonic_1 = require("jsonic");
const multisource_1 = require("../multisource");
const file_1 = require("../resolver/file");
const mem_1 = require("../resolver/mem");
describe('multisource', function () {
    it('happy', () => {
        let j0 = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, {
            resolver: mem_1.makeMemResolver({
                '/a': 'b:1',
            }),
        });
        expect(j0('c:1')).equals({ c: 1 });
        expect(j0('c:@"/a"')).equals({ c: { b: 1 } });
        expect(j0('x:y:1, x:z:2')).equals({ x: { y: 1, z: 2 } });
    });
    it('file', () => {
        let r0 = file_1.makeFileResolver();
        let j0 = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, {
            resolver: r0,
        });
        let deps = {};
        expect(j0('a:1,b:@"./t01.jsonic"', { multisource: { path: __dirname, deps } }))
            .equals({ a: 1, b: { c: 2 } });
        //console.dir(deps, { depth: null })
        deps = {};
        expect(j0('a:1,b:@"./t02.jsonic",c:3', { multisource: { path: __dirname, deps } }))
            .equals({ a: 1, b: { d: 2, e: { f: 4 } }, c: 3 });
        //console.dir(deps, { depth: null })
    });
    it('mem', () => {
        let r0 = mem_1.makeMemResolver({
            '/a': 'a:1',
            '/b': 'b:@"c",',
            '/b/c': 'c:@"/a"',
            '/d': 'd:4',
        });
        let j0 = jsonic_1.Jsonic.make().use(multisource_1.MultiSource, {
            resolver: r0,
        });
        let deps = {};
        expect(j0('q:11,x:@"a",k:@"d",y:@"b",z:@"/b/c",w:22', { multisource: { deps } }))
            .equals({
            q: 11,
            x: { a: 1 },
            k: { d: 4 },
            y: { b: { c: { a: 1 } } },
            z: { c: { a: 1 } },
            w: 22,
        });
        //console.dir(deps, { depth: null })
        expect(remove(deps, 'wen')).equal({
            '/b/c': { '/a': { tar: '/b/c', src: '/a' } },
            '/b': { '/b/c': { tar: '/b', src: '/b/c' } },
            [multisource_1.TOP]: {
                '/a': { tar: multisource_1.TOP, src: '/a' },
                '/d': { tar: multisource_1.TOP, src: '/d' },
                '/b': { tar: multisource_1.TOP, src: '/b' },
                '/b/c': { tar: multisource_1.TOP, src: '/b/c' }
            }
        });
    });
});
function remove(o, k) {
    if (null != o && 'object' === typeof (o)) {
        delete o[k];
        remove(o[multisource_1.TOP], k);
        for (let p in o) {
            remove(o[p], k);
        }
    }
    return o;
}
//# sourceMappingURL=multisource.test.js.map