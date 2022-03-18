import * as vscode from 'vscode';
import { createClient, Client } from 'node-zookeeper-client';



export class ZooKeeperProvider implements vscode.TreeDataProvider<ZkNode> {
    zkClient: Client;

    constructor(private zkHost: string) {
        this.zkClient = createClient('localhost:2181');
    }

    getTreeItem(element: ZkNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ZkNode): Thenable<ZkNode[]> {
        console.log("get children");
        return new Promise((resolve, reject) => {
            this.zkClient = createClient('localhost:2181');
            let that = this;
            this.zkClient.once("connected", function () {
                console.log("connected");
                that.zkClient.getChildren(
                    element ? element.fullPath : '/',
                    function (event) {
                        console.log('Got watcher event: %s', event);
                    },
                    function (error, children, stat) {
                        console.log(error)
                        console.log(children);
                        resolve(children.map(child => {
                            return new ZkNode(child, '--', vscode.TreeItemCollapsibleState.Collapsed, element ? element.fullPath + '/' + child : '/' + child);
                        }));
                    }
                );
                console.log("close zk client");
                that.zkClient.close();
            });
            this.zkClient.connect();
        });
    }
}

class ZkNode extends vscode.TreeItem {
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
}