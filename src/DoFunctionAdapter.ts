export interface MainArgs {
  __ow_headers?: Record<string, any>
  __ow_path?: string
  __ow_method?: 'get' | 'post' | 'put' | 'patch' | 'options' | 'delete'
  __ow_body?: string | Record<string, any>
  __ow_query?: string
  [key: string]: any
}

export interface MainFnResponse {
  statusCode?: number;
  headers?: Record<string, any>; 
  body?: string | Record<string, any>;
  [k: string]: any
}

export type MainFn = (args: MainArgs) => MainFnResponse | Promise<MainFnResponse>

export abstract class DoFunctionAdapter {
  public abstract main(args: MainArgs): MainFnResponse | Promise<MainFnResponse>
}

