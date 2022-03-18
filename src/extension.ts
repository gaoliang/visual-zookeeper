// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ZooKeeperProvider } from './ZooKeeperProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Samples of `window.registerTreeDataProvider`
	const nodeDependenciesProvider = new ZooKeeperProvider("localhost:12345");
	vscode.window.registerTreeDataProvider('visualZooKeeper', nodeDependenciesProvider);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "visual-zookeeper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('visual-zookeeper.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from visual-zookeeper!');
	});


	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
