import { Client } from 'node-zookeeper-client';
import * as vscode from 'vscode';
var zookeeper = require('node-zookeeper-client');

/**
 * readonly preview for node content!. 
 */
export default class ZkPreviewProvider implements vscode.TextDocumentContentProvider {

    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        var client: Client = zookeeper.createClient('localhost:2181');
        let that = this;
        return new Promise((resolve) => {
            client.once('connected', function () {
                client.getData(
                    uri.path,
                    function (error: any, data: any, stat: any) {
                        resolve(data.toString('utf8'));
                        client.close();
                    }
                );
            });
            client.connect();
        });
    }
};