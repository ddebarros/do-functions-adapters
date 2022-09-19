import { DoFunctionAdapter, MainArgs, MainFnResponse } from "../DoFunctionAdapter";

export type Callback<TResult = any> = (error?: Error | string | null, result?: TResult) => void;
export type HandlerSync<TEvent = any, TResult = any> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>,
) => void | Promise<TResult>;

export type HandlerAsync<TEvent = any, TResult = any> = (
  event: TEvent,
  context: Context,
) => Promise<TResult>

export type Handler<TEvent = any, TResult = any> = HandlerSync<TEvent, TResult> | HandlerAsync<TEvent, TResult>;


// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/aws-lambda/handler.d.ts
// https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
export interface Context {
  functionName?: string;
  functionVersion?: string;
  // memoryLimitInMB: string;
  getRemainingTimeInMillis(): number | undefined;
  // DO Specific Items
  namespace?: string;
  activationId?: string;
}

type Options = {
  handler: Handler
};

export class LambdaAdapter extends DoFunctionAdapter {
  private _handler: Handler;

  constructor(options: Options) {
    super();
    this._handler = options.handler;
    this.main = this.main.bind(this);
  }

  protected getRemainingTimeInMillis() {
    const deadline = parseInt(process.env['__OW_DEADLINE'] ?? '');
    if (isNaN(deadline)) {
      return undefined
    }
    return deadline - Date.now(); 
  }

  protected getContext(args: MainArgs): Context {
    return {
      functionName: process.env['__OW_ACTION_NAME']?.split('/').at(-1),
      functionVersion: process.env['__OW_ACTION_VERSION'],
      getRemainingTimeInMillis: this.getRemainingTimeInMillis
    }
  }

  public async main(args: MainArgs): Promise<MainFnResponse> {
    const ctx = this.getContext(args);

    try {
      if (this._handler.length > 2) {
        return new Promise((resolve, reject) => {
          const callback: Callback = (error, result) => {
            if (error) {
              return reject(error)
            }
            return  resolve(result)
          };
          this._handler(args, ctx, callback);
        })
      } else {
        return await (this._handler as HandlerAsync)(args, ctx);
      }
    } catch (error) {
      console.log('Error: ', error)
      return {
        statusCode: 500,
        body: `<h1>Internal Server Error</h1>`
      }
    }
  }
}
