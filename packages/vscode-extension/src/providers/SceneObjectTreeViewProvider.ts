import * as vscode from 'vscode';
import SceneViewProvider from './SceneViewProvider';
import { ViewProviderManager } from './Manager';

export class SceneObjectTreeItem extends vscode.TreeItem {
  private guid: string;
  private rawGameObject: any;

  constructor(gameObject: any, resourcePath: vscode.Uri) {
    super(gameObject.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.guid = gameObject.guid;
    this.rawGameObject = gameObject;

    const colorTheme = vscode.window.activeColorTheme.kind;
    const themePostfix = colorTheme === vscode.ColorThemeKind.Dark ? 'dark' : 'light';

    if (gameObject.type === 'Mesh') {
      this.iconPath = vscode.Uri.joinPath(resourcePath, 'icons', `go-mesh-${themePostfix}.png`);
    } else if (gameObject.type === 'TransformNode') {
      this.iconPath = vscode.Uri.joinPath(resourcePath, 'icons', `go-transform-${themePostfix}.png`);
    }

    this.description = gameObject.type;
    this.tooltip = 'tooltip';
    this.command = {
      command: 'jsar-devtools.inspectGameObject',
      title: 'Inspect GameObject',
      arguments: [gameObject],
    };
  }

  get objectGuid(): string {
    return this.guid;
  }
}

export default class SceneObjectTreeDataProvider implements vscode.TreeDataProvider<SceneObjectTreeItem> {
  private context: vscode.ExtensionContext;
  private resourcePath: vscode.Uri;

  private sceneViewProvider: SceneViewProvider
  private treeChangeEvent = new vscode.EventEmitter<void>();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.resourcePath = vscode.Uri.joinPath(context.extensionUri, 'res');

    this.sceneViewProvider = ViewProviderManager.GetOrCreateSceneViewProvider(context);
    this.sceneViewProvider.addEventListener('documentReady', async () => {
      this.treeChangeEvent.fire();
    });
  }

  public get onDidChangeTreeData(): vscode.Event<void> {
    return this.treeChangeEvent.event;
  }

  getTreeItem(element: SceneObjectTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SceneObjectTreeItem): Thenable<SceneObjectTreeItem[]> {
    const domApi = this.sceneViewProvider.cdpClient.rootSession.api.DOM;
    domApi.getDocument()
      .then(root => {
        console.log(root);
      });

    const children = this.sceneViewProvider.inspectGameObjects(element?.objectGuid)
      .map((go) => new SceneObjectTreeItem(go, this.resourcePath));

    if (children?.length > 0) {
      return Promise.resolve(children);
    } else {
      return Promise.resolve([]);
    }
  }
}
