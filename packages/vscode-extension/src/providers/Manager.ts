import * as vscode from 'vscode';
import SceneViewProvider from './SceneViewProvider';
import ElementsTreeDataProvider from './ElementsTreeViewProvider';
import InspectorViewProvider from './InspectorViewProvider';
import { XsmlProvider } from './lsp/XsmlProvider';

export class ViewProviderManager {
  private static sceneViewProvider: SceneViewProvider;
  private static elementsTreeDataProvider: ElementsTreeDataProvider;
  private static inspectorViewProvider: InspectorViewProvider;
  private static xsmlProvider: XsmlProvider;

  static GetOrCreateSceneViewProvider(context?: vscode.ExtensionContext) {
    if (!this.sceneViewProvider) {
      this.sceneViewProvider = new SceneViewProvider(context);
    }
    return this.sceneViewProvider;
  }

  static GetSceneViewProvider() {
    return this.sceneViewProvider;
  }

  static GetOrCreateElementsTreeDataProvider(context?: vscode.ExtensionContext) {
    if (!this.elementsTreeDataProvider) {
      this.elementsTreeDataProvider = new ElementsTreeDataProvider(context);
    }
    return this.elementsTreeDataProvider;
  }

  static GetElementsTreeDataProvider() {
    return this.elementsTreeDataProvider;
  }

  static GetOrCreateInspectorViewProvider(context?: vscode.ExtensionContext) {
    if (!this.inspectorViewProvider) {
      this.inspectorViewProvider = new InspectorViewProvider(context);
    }
    return this.inspectorViewProvider;
  }

  static GetInspectorViewProvider() {
    return this.inspectorViewProvider;
  }

  static GetOrCreateXsmlProvider(context?: vscode.ExtensionContext) {
    if (!this.xsmlProvider) {
      this.xsmlProvider = new XsmlProvider(context);
    }
    return this.xsmlProvider;
  }

  static GetXsmlProvider() {
    return this.xsmlProvider;
  }
}
