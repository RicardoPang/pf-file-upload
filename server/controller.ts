import Router from 'koa-router'
import fs from 'fs/promises'
import { IMiddleware } from 'koa-router'

export interface Controller {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  fn: IMiddleware<any, {}>
  middleware?: IMiddleware[]
}

function addMapping(router: Router, controllers: Controller[]) {
  controllers.forEach((controller) => {
    const middleware = controller.middleware || []
    const allMiddleware = [...middleware, controller.fn]

    switch (controller.method) {
      case 'GET':
        router.get(controller.path, ...allMiddleware)
        console.log(`register URL mapping: GET ${controller.path}`)
        break
      case 'POST':
        router.post(controller.path, ...allMiddleware)
        console.log(`register URL mapping: POST ${controller.path}`)
        break
      case 'PUT':
        router.put(controller.path, ...allMiddleware)
        console.log(`register URL mapping: PUT ${controller.path}`)
        break
      case 'DELETE':
        router.del(controller.path, ...allMiddleware)
        console.log(`register URL mapping: DELETE ${controller.path}`)
        break
      default:
        console.log(`invalid method: ${controller.method}`)
    }
  })
}

function addControllers(router: Router, dir: string) {
  fs.readdir(__dirname + '/' + dir)
    .then((files) => {
      files
        .filter((f) => f.endsWith('.ts'))
        .forEach(async (f) => {
          console.log(`process controller: ${f}...`)
          const module = await import(__dirname + '/' + dir + '/' + f)
          const controllersArray = module.default as Controller[]
          addMapping(router, controllersArray)
        })
    })
    .catch((err) => {
      console.log(err)
    })
}

export default function (dir = 'controllers') {
  const router = new Router()
  addControllers(router, dir)
  return router.routes()
}
