import { DoFunctionAdapter, MainArgs } from "../DoFunctionAdapter";
import { expressify, ExpressApp } from '@adobe/openwhisk-action-utils';


export class ExpressAdapter extends DoFunctionAdapter {
  private _app: ExpressApp;

  constructor(app: ExpressApp) {
    super()
    this._app = app
    this.main = this.main.bind(this);
  }

  public main(args: MainArgs) {
    return expressify(this._app)(args)
  }
}

