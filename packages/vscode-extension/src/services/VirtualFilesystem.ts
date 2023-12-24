import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { platform } from 'node:os';

let serverInstance: VirtualFilesystem = null;

export default class VirtualFilesystem {
  private httpServer: http.Server;
  private _serverPort: number;
  private _isReady = false;

  constructor() {
    this.httpServer = http.createServer(VirtualFilesystem.CreateRequestHandler());
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.httpServer.listen(() => {
        const addr = this.httpServer.address();
        if (typeof addr === 'string') {
          throw new Error(`Failed to start virtual filesystem server: ${addr}`);
        }
        this._serverPort = addr.port;
        this._isReady = true;
        resolve();
      });
      this.httpServer.once('close', () => {
        this._isReady = false;
      });
    });
  }

  static Start(): Promise<void> {
    if (serverInstance == null || !serverInstance._isReady) {
      serverInstance = new VirtualFilesystem();
      return serverInstance.start();
    }
    return Promise.resolve();
  }

  static Stop() {
    if (serverInstance != null) {
      serverInstance.httpServer.close();
      serverInstance = null;
    }
  }

  static CreateRequestUrl(path: string): string {
    return `http://localhost:${serverInstance._serverPort}/?path=${encodeURIComponent(path)}`;
  }

  static CreateRequestHandler(): http.RequestListener {
    return (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', '*');

      const url = new URL(req.url, 'http://localhost');
      let filePath = url.searchParams.get('path');
      if (platform() === 'win32' && (filePath[0] === '/' || filePath[0] === '\\')) {
        filePath = filePath.slice(1);
      }

      let contentType = 'text/plain';
      if (filePath.endsWith('.js') || filePath.endsWith('.js.gz')) {
        contentType = 'text/javascript';
      } else if (filePath.endsWith('.wasm') || filePath.endsWith('.wasm.gz')) {
        contentType = 'application/wasm';
      } else if (filePath.endsWith('.data') || filePath.endsWith('.data.gz')) {
        contentType = 'application/octet-stream';
      } else if (filePath.endsWith('.html')) {
        contentType = 'text/html';
      }

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(500);
            res.end('Internal server error');
          }
        } else {
          const extname = path.extname(filePath);
          if (extname === '.gz') {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Encoding': 'gzip'
            });
            res.end(content, 'utf-8');
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        }
      });
    };
  }
}
