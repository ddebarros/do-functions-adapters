import { DoFunctionAdapter, MainArgs, MainFn, MainFnResponse } from '../DoFunctionAdapter';

export type RouterMethods = 'get' | 'post' | 'put' | 'delete' | 'patch';
export type RouterMethodFn = (path: RouterMethods, handler: MainFn) => MainFnResponse;

type RouteObj = { method: RouterMethods, path: string, handler: MainFn }
export class Router extends DoFunctionAdapter {
  private _routes: RouteObj[] = []

  public get: RouterMethodFn;
  public post: RouterMethodFn;
  public put: RouterMethodFn;
  public delete: RouterMethodFn;
  public patch: RouterMethodFn;

  constructor() {
    super();

    this.get = this._addRoutes.bind(this, 'get') as RouterMethodFn;
    this.post = this._addRoutes.bind(this, 'post') as RouterMethodFn;
    this.put = this._addRoutes.bind(this, 'put') as RouterMethodFn;
    this.delete = this._addRoutes.bind(this, 'delete') as RouterMethodFn;
    this.patch = this._addRoutes.bind(this, 'patch') as RouterMethodFn;
    this.main = this.main.bind(this)
  }

  private _addRoutes(method: RouterMethods, path: string, handler: MainFn) {
    this._routes.push({ method, path, handler })
  }

  protected getRoute(routes: RouteObj[], args: MainArgs) {
    const requestMethod = args.__ow_method;
    const requestPath = this.normalizeRequestPath(args.__ow_path ?? '/')
  
    let route = routes.find(r => {
      const routePath = r.path.toLowerCase();
      const routeMethod = r.method.toLowerCase();
      return requestPath === routePath && requestMethod === routeMethod
    })
  
    if (!route) {
      let tokens
      route = routes.find(r => {
        if (requestMethod !== r.method) {
          return false
        }
        tokens = this.doPathPartsMatch(requestPath, r)
        return !!tokens
      })
  
      if (tokens) {
        args.params = {
          ...(args.params ?? {}),
          ...tokens as object,
        }
      }
    }
    return route
  }

  protected normalizeRequestPath(path: string) {
    let p = (!path || path.trim() === '') ? '/' : path.trim()
    return p === '/' 
      ? '/' : 
      p.replace(/\/$/, '')
  }

  protected doPathPartsMatch(eventPath: string, route: RouteObj) {
    const eventPathParts = eventPath.split('/')
    const routePathParts = route.path.split('/')
  
    // Fail fast if they're not the same length
    if (eventPathParts.length !== routePathParts.length) {
      return false
    }
    let tokens: any = {}
  
    // Start with 1 because the url should always start with the first back slash
    for (let i = 1; i < eventPathParts.length; ++i) {
      const pathPart = eventPathParts[i]
      const routePart = routePathParts[i]
  
      // If the part is a curly braces value
      let pathPartMatch = /\{(\w+)}/g.exec(routePart)
      if (pathPartMatch) {
        tokens[pathPartMatch[1]] = pathPart
        continue
      }
  
      // Fail fast if a part doesn't match
      if (routePart !== pathPart) {
        return false
      }
    }
  
    return tokens
  }

  protected defaultUnknownRoute(routes: RouteObj[], path: string, httpMethod?: string) {
    const methodMatches = routes
      .filter(r => path === r.path.toLowerCase())
      .map(r => r.method.toUpperCase())
  
    if (methodMatches.length > 0) {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Methods': methodMatches.join(', ')
        }
      }
    }
  
    return {
      statusCode: 404,
      body: `${httpMethod ?? ''.toUpperCase()}: ${path}`
    }
  }

  public async main(args: MainArgs) {
    const route = this.getRoute(this._routes, args);
    if (!route) {
      return this.defaultUnknownRoute(
        this._routes,
        this.normalizeRequestPath(args.__ow_path ?? '/'),
        args.__ow_method
      )
    }

    try {
      return await route.handler(args);
    } catch (error) {
      console.log('Error: ', error)
      return {
        statusCode: 500,
        body: `<h1>Internal Server Error</h1>`
      }
    }
  }
}
