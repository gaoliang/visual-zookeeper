// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ZkPreviewProvider from './ZkPreviewProvider';
import { ZooKeeperProvider, ZkNode } from './ZooKeeperProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const readOnlyScheme = 'zk-readonly';
	let zkPreviewProvider = new ZkPreviewProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(readOnlyScheme, zkPreviewProvider));

	context.subscriptions.push(vscode.commands.registerCommand('visualZooKeeper.viewNodeContent', async (node: ZkNode) => {
		let path;
		if (node) {
			path = node.fullPath;
		} else {
			path = await vscode.window.showInputBox({ placeHolder: 'zookeeper node path' });
		}
		if (path) {
			const uri = vscode.Uri.parse('zk-readonly:' + path);
			zkPreviewProvider.onDidChangeEmitter.fire(uri);
			const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
			await vscode.window.showTextDocument(doc, { preview: false });
		} else {
			vscode.window.showInformationMessage('zk path is empty');
		}
	}));

	const zooKeeperProvider = new ZooKeeperProvider("localhost:2181");
	vscode.window.registerTreeDataProvider('visualZooKeeper', zooKeeperProvider);
	
	vscode.commands.registerCommand('visualZooKeeper.refreshNode', () =>
		zooKeeperProvider.refresh()
	);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "visual-zookeeper" is now active!');

}

// this method is called when your extension is deactivated
export function deactivate() { }
