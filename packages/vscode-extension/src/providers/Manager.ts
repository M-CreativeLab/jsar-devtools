import * as vscode from 'vscode';
import ConsoleViewProvider from './ConsoleViewProvider';
import SceneViewProvider from './SceneViewProvider';
import ElementsTreeDataProvider from './ElementsTreeViewProvider';
import InspectorViewProvider from './InspectorViewProvider';
import XREmulatorViewProvider from './XREmulatorViewProvider';
import { XsmlProvider } from './lsp/XsmlProvider';

export class ViewProviderManager {
  private static consoleViewProvider: ConsoleViewProvider;
  private static sceneViewProvider: SceneViewProvider;
  private static elementsTreeDataProvider: ElementsTreeDataProvider;
  private static inspectorViewProvider: InspectorViewProvider;
  private static xrEmulatorViewProvider: XREmulatorViewProvider;
  private static xsmlProvider: XsmlProvider;

  static GetOrCreateConsoleViewProvider(context?: vscode.ExtensionContext) {
    if (!this.consoleViewProvider) {
      this.consoleViewProvider = new ConsoleViewProvider(context);
    }
    return this.consoleViewProvider;
  }

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

  static GetOrCreateXREmulatorViewProvider(context?: vscode.ExtensionContext) {
    if (!this.xrEmulatorViewProvider) {
      this.xrEmulatorViewProvider = new XREmulatorViewProvider(context);
    }
    return this.xrEmulatorViewProvider;
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
