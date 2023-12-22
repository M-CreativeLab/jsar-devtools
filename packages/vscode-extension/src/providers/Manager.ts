import * as vscode from 'vscode';
import SceneViewProvider from './SceneViewProvider';
import SceneObjectTreeDataProvider from './SceneObjectTreeViewProvider';
import InspectorViewProvider from './InspectorViewProvider';
import { XsmlProvider } from './lsp/XsmlProvider';

export class ViewProviderManager {
  private static sceneViewProvider: SceneViewProvider;
  private static sceneObjectTreeDataProvider: SceneObjectTreeDataProvider;
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

  static GetOrCreateSceneObjectTreeDataProvider(context?: vscode.ExtensionContext) {
    if (!this.sceneObjectTreeDataProvider) {
      this.sceneObjectTreeDataProvider = new SceneObjectTreeDataProvider(context);
    }
    return this.sceneObjectTreeDataProvider;
  }

  static GetSceneObjectTreeDataProvider() {
    return this.sceneObjectTreeDataProvider;
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
