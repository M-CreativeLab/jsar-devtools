import * as vscode from 'vscode';
import { join } from 'node:path';
import fsPromises from 'node:fs/promises';
import { cdp } from '@yodaos-jsar/dom';
import VirtualFilesystem from '../services/VirtualFilesystem';

export default class SceneViewProvider extends EventTarget {
  private context: vscode.ExtensionContext;
  private workspacePath: string;
  private openInWorkspace: boolean = true;

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

  cdpClient: ReturnType<typeof cdp.createRemoteClient>;
  cdpTransport: cdp.LoopbackTransport;

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

    const transport = this.cdpTransport = new cdp.LoopbackTransport();
    transport.onDidSend((data) => {
      if (this.panel) {
        this.panel.webview.postMessage({
          command: 'cdp',
          args: [data],
        });
      }
    });
    this.cdpClient = cdp.createRemoteClient(transport);
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
      this.panel.reveal();
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
      } else if (message?.command === 'documentReady') {
        this.dispatchEvent(new Event('documentReady'));
      } else if (message?.command === 'cdp' && message.args?.[0]) {
        this.cdpTransport.receive(message.args[0]);
      }
    });

    // Create a watcher to reload the scene view when the source file is saved.
    const sourceFilesWatcher = vscode.workspace.onDidSaveTextDocument(() => this.reload());

    // Panel `dispose` event.
    this.panel.onDidDispose(() => {
      sourceFilesWatcher.dispose();
      this.panel = null;
    });
  }

  private async readPackageManifest() {
    const manifestJson = await fsPromises.readFile(join(this.workspacePath, 'package.json'), 'utf8');
    return JSON.parse(manifestJson);
  }

  private load(filename: string) {
    this.panel.webview.postMessage({
      command: 'load',
      args: [
        VirtualFilesystem.CreateRequestUrl(filename),
      ],
    });
  }

  private reload() {
    if (!this.panel) {
      vscode.window.showErrorMessage('Scene view is not opened.');
      return;
    }
    this.panel.webview.postMessage({
      command: 'reload',
      args: [],
    });
  }

  private getWebviewContent(): string {
    const sceneJsPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'js/scene.js'));
    // icons of scene controls
    const resetSceneIconPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'icons/scene-reset.png'));
    const reloadSceneIconPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'icons/scene-reload.png'));
    // icons of camera controls
    const rotateCameraIconPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'icons/axis-ratation.png'));
    const zoomCameraIconPath = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.resourcePath, 'icons/scene-zoom.png'));

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Scene View</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <script src="${sceneJsPath}"></script>
    <style>
      :root {
        --scene-icon-size: 30px;
      }

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

      #fullscreen-controls button {
        background-color: transparent;
        border: 0;
        cursor: pointer;
      }
      #fullscreen-controls button>img {
        opacity: 0.75;
        transition: opacity 0.3s;
        touch-action: none;
        user-select: none;
        -webkit-user-drag: none;
      }
      #fullscreen-controls button:active>img {
        opacity: 1;
      }

      #fullscreen-controls>section {
        z-index: 100;
      }
      #fullscreen-controls>.controls {
        position: fixed;
        display: flex;
        gap: 3px;
        padding: 3px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        transition: background-color 0.3s;
      }
      #fullscreen-controls>.controls:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
      #scene-controls {
        bottom: 5px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: row;
      }
      #scene-controls button, #scene-controls button>img {
        height: var(--scene-icon-size);
        width: fit-content;
      }
      #camera-controls {
        right: 5px;
        top: 20%;
        transform: translateY(-50%);
        flex-direction: column;
      }
      #camera-controls button, #camera-controls button>img {
        height: fit-content;
        width: var(--scene-icon-size);
      }
    </style>
  </head>
  <body>
    <div id="babylonjs-root">
      <canvas id="renderCanvas"></canvas>
      <div id="fullscreen-controls">
        <section id="scene-controls" class="controls">
          <button id="reset-scene">
            <img src="${resetSceneIconPath}" />
          </button>
          <button id="reload-scene">
            <img src="${reloadSceneIconPath}" />
          </button>
        </section>
        <section id="camera-controls" class="controls">
          <button id="rotate-camera">
            <img src="${rotateCameraIconPath}" />
          </button>
        </section>
      </div>
    </div>
  </body>
</html>
    `;
  }
}
