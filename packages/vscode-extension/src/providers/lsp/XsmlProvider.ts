import { getNodeFileFS } from './NodejsFileSystem';
import { Disposable, ExtensionContext, l10n } from 'vscode';
import { startClient, LanguageClientConstructor, AsyncDisposable } from './XsmlClient';
import { ServerOptions, TransportKind, LanguageClientOptions, LanguageClient } from 'vscode-languageclient/node';
import { TextDecoder } from 'util';

export class XsmlProvider {
  constructor(private context: ExtensionContext) {}
  client: AsyncDisposable;

  async activate() {
    const serverMain = `./dist/xsml-language-server/index.js`;
    const serverModule = this.context.asAbsolutePath(serverMain);

    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=' + (8000 + Math.round(Math.random() * 999))] };

    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };
    const newLanguageClient: LanguageClientConstructor = (id: string, name: string, clientOptions: LanguageClientOptions) => {
      return new LanguageClient(id, name, serverOptions, clientOptions);
    };

    const timer = {
      setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
        const handle = setTimeout(callback, ms, ...args);
        return { dispose: () => clearTimeout(handle) };
      }
    };

    this.client = await startClient(this.context, newLanguageClient, {
      fileFs: getNodeFileFS(),
      TextDecoder,
      timer,
    });
  }

  async deactive() {
    if (this.client) {
      await this.client.dispose();
      this.client = undefined;
    }
  }
}
