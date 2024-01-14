import * as vscode from 'vscode';
import { ViewProviderManager } from './providers/Manager';
import { createCommandsList } from './commands/index';

export async function activate(context: vscode.ExtensionContext) {
  const commands = createCommandsList(context);
  context.subscriptions.push.apply(context.subscriptions, [
    vscode.commands.registerCommand('jsar-devtools.packageProject', commands.packageProject),
    vscode.commands.registerCommand('jsar-devtools.showSceneView', commands.showSceneView),
    vscode.commands.registerCommand('jsar-devtools.openSelectedXsml', commands.openSceneViewWithSelected),
    vscode.commands.registerCommand('jsar-devtools.inspectElement', commands.inspectElement),
    vscode.commands.registerCommand('jsar-devtools.connectDevice', commands.connectDevice),
    vscode.commands.registerCommand('jsar-devtools.installToConnectedDevice', commands.installToConnectedDevice),
    vscode.commands.registerCommand('jsar-devtools.disableDeviceServer', commands.disableDevice),
    vscode.commands.registerCommand('jsar-devtools.openDocumentation', commands.openDocumentation),

    // Register tree typed views
    vscode.window.registerTreeDataProvider('jsar-devtools.elementsHirarchy',
      ViewProviderManager.GetOrCreateElementsTreeDataProvider(context)),

    // Register webview panel
    vscode.window.registerWebviewViewProvider('jsar-devtools.console',
      ViewProviderManager.GetOrCreateConsoleViewProvider(context)),
    vscode.window.registerWebviewViewProvider('jsar-devtools.elementInspector',
      ViewProviderManager.GetOrCreateInspectorViewProvider(context)),
    vscode.window.registerWebviewViewProvider('jsar-devtools.webxr.emulator',
      ViewProviderManager.GetOrCreateXREmulatorViewProvider(context)),

    // Register status bar
    (() => {
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
      statusBarItem.text = "$(codicon-sync) JSAR";
      statusBarItem.command = 'jsar-devtools.openDocumentation';
      statusBarItem.tooltip = 'Open JSAR Documentation';
      statusBarItem.show();
      return statusBarItem;
    })(),

    // Create output channel
    (() => {
      const sceneLogsChannel = vscode.window.createOutputChannel('JSAR Scene Logs');
      const sceneViewProvider = ViewProviderManager.GetOrCreateSceneViewProvider(context)
      sceneViewProvider.addEventListener('console', (event: CustomEvent) => {
        sceneLogsChannel.appendLine(event.detail);
      });
      return sceneLogsChannel;
    })(),
  ]);

  // Register custom providers which should be disposed manually
  await ViewProviderManager.GetOrCreateXsmlProvider(context)
    .activate();
}

export async function deactivate(): Promise<void> {
  // Dispose custom providers which should be disposed manually
  await ViewProviderManager.GetXsmlProvider()
    ?.deactive();
}
