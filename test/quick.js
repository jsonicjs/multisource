

const { Jsonic, Debug } = require('@jsonic/jsonic-next')
const { MultiSource } = require('..')
const { makeMemResolver } = require('../dist/resolver/mem')

const opts = {
  resolver: makeMemResolver({
    'a.jsonic': 'a:1',
  }),
}
const j = Jsonic.make().use(Debug,{trace:true}).use(MultiSource, opts)

// console.log(j('x:@a.jsonic'))
// console.log(j('@a.jsonic'))
// console.log(j('x:1,@a.jsonic',{log:-1}))
console.log(j('[x:1,@a.jsonic]',{log:-1}))
// console.log(j('[x:1 @a.jsonic]',{log:-1}))
// console.log(j('@a.jsonic y:2'))
