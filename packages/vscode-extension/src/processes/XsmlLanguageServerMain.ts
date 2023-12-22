/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as l10n from '@vscode/l10n';
import { createConnection, Connection, Disposable } from 'vscode-languageserver/node';
import { formatError } from '../services/languages/utils/Runner';
import { RuntimeEnvironment, startServer } from '../services/languages/XsmlLanguageServer';
import { getNodeFileFS } from './NodejsFileSystem';

async function setupMain() {
  const l10nLog: string[] = [];
  const i10lLocation = process.env['VSCODE_L10N_BUNDLE_LOCATION'];
  if (i10lLocation) {
    try {
      await l10n.config({ uri: i10lLocation });
      l10nLog.push(`l10n: Configured to ${i10lLocation.toString()}`);
    } catch (e) {
      l10nLog.push(`l10n: Problems loading ${i10lLocation.toString()} : ${e}`);
    }
  }

  // Create a connection for the server.
  const connection: Connection = createConnection();
  console.log = connection.console.log.bind(connection.console);
  console.error = connection.console.error.bind(connection.console);

  process.on('unhandledRejection', (e: any) => {
    connection.console.error(formatError(`Unhandled exception`, e));
  });
  const runtime: RuntimeEnvironment = {
    timer: {
      setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable {
        const handle = setImmediate(callback, ...args);
        return { dispose: () => clearImmediate(handle) };
      },
      setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
        const handle = setTimeout(callback, ms, ...args);
        return { dispose: () => clearTimeout(handle) };
      }
    },
    fileFs: getNodeFileFS()
  };
  startServer(connection, runtime);

  // Configure logging of l10n
  l10nLog.forEach(console.log);
}
setupMain();
