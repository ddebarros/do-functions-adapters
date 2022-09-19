import { Config } from "apollo-server-core";
import { DoFunctionAdapter, MainArgs, MainFn } from "../DoFunctionAdapter";
import { ApolloServer } from "./ApolloServer";


export class ApolloGraphQLAdapter extends DoFunctionAdapter {
  public server: ApolloServer;
  private _handler: MainFn;

  constructor(options: Config<MainArgs>) {
    super()
    this.server = new ApolloServer(options);
    this._handler = this.server.createHandler();
    this.main = this.main.bind(this);
  }

  public main(args: MainArgs) {
    return this._handler(args);
  }
}
