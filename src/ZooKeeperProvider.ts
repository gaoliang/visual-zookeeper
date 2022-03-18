import * as vscode from 'vscode';
import { ZkNode } from './ZkNode';
import * as zkClient from './ZkClient';

export class ZooKeeperProvider implements vscode.TreeDataProvider<ZkNode> {
    constructor(public zkServer: string) {
    }
    private _onDidChangeTreeData: vscode.EventEmitter<ZkNode | undefined | null | void> = new vscode.EventEmitter<ZkNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ZkNode | undefined | null | void> = this._onDidChangeTreeData.event;


    getTreeItem(element: ZkNode): vscode.TreeItem {
        return element;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildren(element?: ZkNode): Thenable<ZkNode[]> {
        return zkClient.getChildren(element);
    }
}

