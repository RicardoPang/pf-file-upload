import Router from 'koa-router'
import fs from 'fs/promises'
import { IMiddleware } from 'koa-router'
import path from 'path'

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
      case 'GET': {
        router.get(controller.path, ...allMiddleware)
        console.log(`register URL mapping: GET ${controller.path}`)
        break
      }
      case 'POST': {
        router.post(controller.path, ...allMiddleware)
        console.log(`register URL mapping: POST ${controller.path}`)
        break
      }
      case 'PUT': {
        router.put(controller.path, ...allMiddleware)
        console.log(`register URL mapping: PUT ${controller.path}`)
        break
      }
      case 'DELETE': {
        router.del(controller.path, ...allMiddleware)
        console.log(`register URL mapping: DELETE ${controller.path}`)
        break
      }
      default:
        console.log(`invalid method: ${controller.method}`)
    }
  })
}

async function addControllers(router: Router, dir: string) {
  const files = await fs.readdir(path.resolve(__dirname, dir))
  await Promise.all(
    files
      .filter((r) => r.endsWith('.ts'))
      .map(async (f) => {
        const module = await import(path.resolve(__dirname, dir, f))
        const controllersArray = module.default as Controller[]
        addMapping(router, controllersArray)
      })
  )
}

export default function (dir = 'controllers') {
  const router = new Router()
  addControllers(router, dir)
  return router.routes()
}
