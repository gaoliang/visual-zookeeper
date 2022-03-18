import * as vscode from 'vscode';
import { createClient, Client } from 'node-zookeeper-client';



export class ZooKeeperProvider implements vscode.TreeDataProvider<ZkNode> {
    constructor(public zkServer: string) {
    }
    private _onDidChangeTreeData: vscode.EventEmitter<ZkNode | undefined | null | void> = new vscode.EventEmitter<ZkNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ZkNode | undefined | null | void> = this._onDidChangeTreeData.event;


    getTreeItem(element: ZkNode): vscode.TreeItem {
        return element;
    }

    public setZkServer(zkServer: string) {

    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildren(element?: ZkNode): Thenable<ZkNode[]> {
        return new Promise((resolve, reject) => {
            let zkClient = createClient(this.zkServer);
            let that = this;
            zkClient.once("connected", function () {
                zkClient.getChildren(
                    element ? element.fullPath : '/',
                    function (error, children, stat) {
                        resolve(children.map(child => {
                            return new ZkNode(
                                child, '',
                                vscode.TreeItemCollapsibleState.Collapsed,
                                element ? element.fullPath + '/' + child : '/' + child
                            );
                        }));
                        zkClient.close();
                    }
                );

            });
            zkClient.connect();
        });
    }
}

export class ZkNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public fullPath: string,
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.description}`;
        this.description = this.description;
    }
    contextValue = "zkNode";
}