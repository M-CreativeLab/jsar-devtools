import * as vscode from 'vscode';
import * as jsardom from '@yodaos-jsar/dom';

import SceneViewProvider from './SceneViewProvider';
import { ViewProviderManager } from './Manager';
import { attrsToMap } from '../utils';

const NodeTypes = jsardom.nodes.NodeTypes;

export class ElementsTreeItem extends vscode.TreeItem {
  private _children: ElementsTreeItem[] = [];

  constructor(private _element, public resourcePath: vscode.Uri) {
    const nodeName = _element.nodeName as string;
    const attrs = attrsToMap(_element.attributes);

    const colorTheme = vscode.window.activeColorTheme.kind;
    const themePostfix = colorTheme === vscode.ColorThemeKind.Dark ? 'dark' : 'light';

    let children: ElementsTreeItem[] = [];
    if (Array.isArray(_element?.children)) {
      children = _element.children
        .filter(child => child.nodeType === NodeTypes.ELEMENT_NODE)
        .map(child => new ElementsTreeItem(child, resourcePath));
    }

    super(
      nodeName?.toLowerCase(),
      children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
    this._children = children;

    if (nodeName === 'Mesh') {
      this.iconPath = vscode.Uri.joinPath(resourcePath, 'icons', `go-mesh-${themePostfix}.png`);
    } else {
      this.iconPath = vscode.Uri.joinPath(resourcePath, 'icons', `go-transform-${themePostfix}.png`);
    }

    if (attrs.has('id')) {
      this.description = `#${attrs.get('id')}`;
    } else if (attrs.has('class')) {
      this.description = `.${attrs.get('class')}`;
    } else {
      this.description = nodeName;
    }

    let tooltip = nodeName || '';
    if (attrs.has('id')) {
      tooltip += `#${attrs.get('id')}`;
    }
    this.tooltip = tooltip;
    this.command = {
      command: 'jsar-devtools.inspectElement',
      title: 'Inspect Element',
      arguments: [_element, attrs],
    };
  }

  get children(): ElementsTreeItem[] {
    return this._children;
  }
}

export default class ElementsTreeDataProvider implements vscode.TreeDataProvider<ElementsTreeItem> {
  private context: vscode.ExtensionContext;
  private resourcePath: vscode.Uri;

  private sceneViewProvider: SceneViewProvider;
  private currentDocument;
  private treeChangeEvent = new vscode.EventEmitter<void>();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.resourcePath = vscode.Uri.joinPath(context.extensionUri, 'res');

    this.sceneViewProvider = ViewProviderManager.GetOrCreateSceneViewProvider(context);
    this.sceneViewProvider.addEventListener('documentReady', async () => {
      const domApi = this.sceneViewProvider.cdpClient.rootSession.api.DOM;
      this.currentDocument = (await domApi.getDocument()).root;
      this.treeChangeEvent.fire();
    });
  }

  public get onDidChangeTreeData(): vscode.Event<void> {
    return this.treeChangeEvent.event;
  }

  getTreeItem(element: ElementsTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ElementsTreeItem): Thenable<ElementsTreeItem[]> {
    if (!element) {
      if (!this.currentDocument) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve([
          new ElementsTreeItem(this.currentDocument, this.resourcePath)
        ]);
      }
    } else {
      return Promise.resolve(element.children);
    }
  }
}
