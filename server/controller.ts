import { koaBody } from 'koa-body'
import fs from 'fs'

// add url-route in /controllers:
function addMapping(router, mapping) {
  for (const url in mapping) {
    if (url.startsWith('GET ')) {
      const path = url.substring(4)
      router.get(path, mapping[url])
      console.log(`register URL mapping: GET ${path}`)
    } else if (url.startsWith('POST ')) {
      const path = url.substring(5)

      if (path === '/api/upload') {
        router.post(path, koaBody({ multipart: true }), mapping[url])
      } else {
        router.post(path, mapping[url])
      }
      console.log(`register URL mapping: POST ${path}`)
    } else if (url.startsWith('PUT ')) {
      const path = url.substring(4)
      router.put(path, mapping[url])
      console.log(`register URL mapping: PUT ${path}`)
    } else if (url.startsWith('DELETE ')) {
      const path = url.substring(7)
      router.del(path, mapping[url])
      console.log(`register URL mapping: DELETE ${path}`)
    } else {
      console.log(`invalid URL: ${url}`)
    }
  }
}

function addControllers(router, dir) {
  fs.readdirSync(__dirname + '/' + dir)
    .filter((f) => {
      return f.endsWith('.ts')
    })
    .forEach((f) => {
      console.log(`process controller: ${f}...`)
      const mapping = require(__dirname + '/' + dir + '/' + f)
      addMapping(router, mapping)
    })
}

module.exports = function (dir) {
  const controllers_dir = dir || 'controllers',
    router = require('koa-router')()
  addControllers(router, controllers_dir)
  return router.routes()
}
