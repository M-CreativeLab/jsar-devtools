import * as vscode from 'vscode';
import { dirname, join } from 'node:path';
import fsPromises from 'node:fs/promises';
import { correctVscodePath } from '../utils';
import VirtualFilesystem from '../services/VirtualFilesystem';

export default class SceneViewProvider extends EventTarget {
  private context: vscode.ExtensionContext;
  private workspacePath: string;
  private openInWorkspace: boolean = true;
  private cwd: string;

  /**
   * The extension's resource path
   */
  private resourcePath: vscode.Uri;

  private panel: vscode.WebviewPanel;
  private isUnityReady: boolean = false;

  /**
   * This type is used to decode the buffer data from Unity, and can be used for vscode inspector.
   */
  private gameObjects: any[] = [];

  constructor(context: vscode.ExtensionContext) {
    super();

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspacePath = workspaceFolders[0].uri.fsPath;
    } else {
      this.openInWorkspace = false;
    }

    this.context = context;
    this.resourcePath = vscode.Uri.joinPath(context.extensionUri, 'res');
  }

  /**
   * Open the scene view.
   */
  async open() {
    try {
      const manifest = await this.readPackageManifest();
      if (!manifest.main) {
        throw new TypeError(`failed to find the "main" from your package.json`);
      }
      const target = join(this.workspacePath, manifest.main);
      this.createWebviewPanel(target);
    } catch (err) {
      vscode.window.showErrorMessage(err?.message || 'Unknown error');
    }
  }

  openWithPath(target: string) {
    try {
      this.createWebviewPanel(target);
    } catch (err) {
      vscode.window.showErrorMessage(err?.message || 'Unknown error');
    }
  }

  inspectGameObjects(parentGuid?: string) {
    if (typeof parentGuid !== 'string') {
      return this.gameObjects.filter(go => go.data?.parentGuid === undefined);
    } else {
      return this.gameObjects.filter(go => go.data?.parentGuid === parentGuid);
    }
  }

  private async createWebviewPanel(entryPath: string) {
    /**
     * If the panel is already created, just show it.
     */
    if (this.panel != null) {
      this.load(entryPath);
      return;
    }

    await VirtualFilesystem.Start();
    this.panel = vscode.window.createWebviewPanel(
      'JSAR_SceneView',
      'Scene View',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.resourcePath],
      }
    );
    this.panel.webview.html = this.getWebviewContent();
    this.panel.webview.onDidReceiveMessage((message) => {
      if (message?.command === 'ready') {
        this.load(entryPath);
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
    });
  }

  private async readPackageManifest() {
    const manifestJson = await fsPromises.readFile(join(this.workspacePath, 'package.json'), 'utf8');
    return JSON.parse(manifestJson);
  }

  private async start(xsmlPath?: string) {
    if (!xsmlPath) {
      const manifest = await this.readPackageManifest();
      if (!manifest.main) {
        throw new TypeError(`failed to find the "main" from your package.json`);
      }
      xsmlPath = join(this.workspacePath, manifest.main);
    }
    this.cwd = dirname(xsmlPath);

    this.reload(xsmlPath);
    vscode.workspace.onDidSaveTextDocument(async () => {
      this.reload(xsmlPath);
    });
  }

  private load(filename: string) {
    this.panel.webview.postMessage({
      command: 'load',
      args: [
        VirtualFilesystem.CreateRequestUrl(filename),
      ],
    });
  }

  private reload(scriptSourceText: string) {
    if (!this.panel) {
      return;
    }
    this.panel.webview.postMessage({
      command: 'TransmuteWebGLInterface.OnExecuteScriptAsURI',
      args: [{
        Uri: correctVscodePath(scriptSourceText),
        DestroyPresent: true,
      }],
    });
  }

  private getWebviewContent(): string {
    const sceneJsPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'js/scene.js'));
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Scene View</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <script src="${sceneJsPath}"></script>
    <style>
      html,
      body {
        overflow: hidden;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }
      #babylonjs-root {
        width: 100vw;
        height: 100vh;
        flex: 1;
      }
      #renderCanvas {
        width: 100%;
        height: 100%;
        touch-action: none;
      }
    </style>
  </head>
  <body>
    <div id="babylonjs-root">
      <canvas id="renderCanvas"></canvas>
    </div>
  </body>
</html>
    `;
  }
}
