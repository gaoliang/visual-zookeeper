// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ZkNode } from './ZkNode';
import ZkPreviewProvider from './ZkPreviewProvider';
import { ZooKeeperProvider } from './ZooKeeperProvider';
import * as zkClient from './ZkClient';
import { ZkFS } from './zkFileSystemProvider';

const BIG_SOLIDUS = "⧸";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const zkFS = new ZkFS();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('zkfs', zkFS, { isCaseSensitive: true }));

	const readOnlyScheme = 'zk-readonly';
	let zkPreviewProvider = new ZkPreviewProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(readOnlyScheme, zkPreviewProvider));
	context.subscriptions.push(vscode.commands.registerCommand('visualZooKeeper.viewNodeContent', async (node: ZkNode) => {
		if (!zkClient.client || !zkClient.isConnected) {
			vscode.window.showErrorMessage(`[Visual ZooKeeper]: faild to view node content, server is not connected!`, 'Configure ZK Server').then(
				(value) => {
					if (value === 'Configure ZK Server') {
						vscode.commands.executeCommand('visualZooKeeper.configureServer');
					}
				}
			);
			return;
		}
		// two source: tree item click or cmmand input. 
		let path;
		if (node) {
			path = node.fullPath;
		} else {
			path = await vscode.window.showInputBox({ placeHolder: 'ZooKeeper node path' });
		}

		if (path) {
			const uri = vscode.Uri.parse('zk-readonly:' + path);
			zkPreviewProvider.onDidChangeEmitter.fire(uri);
			const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
			await vscode.window.showTextDocument(doc, { preview: false });
		} else {
			vscode.window.showInformationMessage('[Visual ZooKeeper] node path is empty');
		}
	}));

	const zooKeeperProvider = new ZooKeeperProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('visualZooKeeper', zooKeeperProvider));

	context.subscriptions.push(vscode.commands.registerCommand('visualZooKeeper.refreshNode', () =>
		zooKeeperProvider.refresh()
	));

	context.subscriptions.push(vscode.commands.registerCommand('visualZooKeeper.configureServer', async () => {
		let server = await vscode.window.showInputBox({ placeHolder: 'Comma separated host:port pairs,each represents a ZooKeeper server.' });
		if (server) {
			zkClient.createClient(server);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('visualZooKeeper.editNode', async (node: ZkNode) => {

		if (!zkClient.client || !zkClient.isConnected) {
			vscode.window.showErrorMessage(`[Visual ZooKeeper]: faild to view node content, server is not connected!`, 'Configure ZK Server').then(
				(value) => {
					if (value === 'Configure ZK Server') {
						vscode.commands.executeCommand('visualZooKeeper.configureServer');
					}
				}
			);
			return;
		}
		// two source: tree item click or cmmand input. 
		let path;
		if (node) {
			path = node.fullPath;
		} else {
			path = await vscode.window.showInputBox({ placeHolder: 'ZooKeeper node path' });
		}

		if (path) {
			if (path.indexOf(BIG_SOLIDUS) !== -1) {
				throw new Error('[Visual ZooKeeper] Sorry, can not edit node path that contains "/" (U+29F8 BIG SOLIDUS)');
			}
			// this is a trick: use U+29F8 "⧸" replace U+002f / slash. and put file at root /.
			let filePath = '/' + path.split("/").join(BIG_SOLIDUS);
			const uri = vscode.Uri.parse('zkfs:' + filePath);
			vscode.commands.executeCommand("vscode.open", uri, {}, path);
		} else {
			vscode.window.showInformationMessage('[Visual ZooKeeper] node path is empty');
		}
	}));

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "visual-zookeeper" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() { }
