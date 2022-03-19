import * as vscode from 'vscode';
import * as zkClient from './ZkClient';

/**
 * readonly preview for node content!. 
 */
export default class ZkPreviewProvider implements vscode.TextDocumentContentProvider {

    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return new Promise((resolve, reject) => {
            if (!zkClient.client || !zkClient.isConnected) {
                reject("[Visual ZooKeeper]: client is not connected!");
            }
            zkClient.client?.getData(
                uri.path,
                function (error: any, data: any, stat: any) {
                    if (error) {
                        reject(error);
                    }
                    resolve(data.toString('utf8'));
                }
            );
        });
    }
}