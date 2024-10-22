# multisource
Load partial values from multiple sources, such as other files.


[![npm version](https://img.shields.io/npm/v/@jsonic/multisource.svg)](https://npmjs.com/package/@jsonic/multisource)
[![build](https://github.com/jsonicjs/multisource/actions/workflows/build.yml/badge.svg)](https://github.com/jsonicjs/multisource/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/jsonicjs/multisource/badge.svg?branch=main)](https://coveralls.io/github/jsonicjs/multisource?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/jsonicjs/multisource/badge.svg)](https://snyk.io/test/github/jsonicjs/multisource)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/22471/branches/663911/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=22471&bid=663911)
[![Maintainability](https://api.codeclimate.com/v1/badges/eb0f99f5302e3bd37924/maintainability)](https://codeclimate.com/github/jsonicjs/multisource/maintainability)


| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |



## Basic Example


```yml
# file: foo.jsonic
a:1
```

```ts
import { Jsonic } from '@jsonic/jsonic-next'
import { MultiSource } from '@jsonic/multisource'
import { makeFileResolver } from '@jsonic/multisource/resolver/file'

let j = Jsonic.make().use(MultiSource, {
  resolver: makeFileResolver(),
})

const out = j('@"foo.jsonic" b:2')
// out === { a:1, b:2 }

```



<!--START:options-->
## Options
* _implictExt_
  * _0_: `string` (default: jsonic) - 0
  * _1_: `string` (default: jsc) - 1
  * _2_: `string` (default: json) - 2
  * _3_: `string` (default: js) - 3
* _markchar_: `string` (default: @) - markchar
* _processor_
  * __: `function` (default: (res) => (res.val = process(res.src, res))) - 
  * _js_: `instance` (required) - js
  * _jsc_: `instance` (required) - jsc
  * _json_: `function` (default: (res) => (res.val = process(res.src, res))) - json
  * _jsonic_: `instance` (required) - jsonic
<!--END:options-->
