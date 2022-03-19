import * as zookeeper from 'node-zookeeper-client';
import * as vscode from 'vscode';
import { ZkNode } from './ZkNode';

export let server = '';
export let isConnected = false;
export let client: zookeeper.Client | null = null;
let statusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBar.text = '$(debug-disconnect) ZK: Disconnected';
statusBar.show();

export const createClient = (server: string) => {
    client = zookeeper.createClient(server,
        { sessionTimeout: 1000 }
    );
    isConnected = false;
    server = server;

    client.on("state", (state) => {
        console.log(`[Visual ZooKeeper]: client state turn to  ${state}`);
        switch (state) {
            case zookeeper.State.SYNC_CONNECTED:
                statusBar.text = '$(check) ZK: connceted';
                statusBar.tooltip = 'ZooKeeper server is connected to ' + server;
                vscode.window.showInformationMessage('[Visual ZooKeeper]: Connected to ' + server);
                isConnected = true;
                // refresh nodes after connected!;
                vscode.commands.executeCommand("visualZooKeeper.refreshNode");
                break;
            case zookeeper.State.DISCONNECTED:
            case zookeeper.State.AUTH_FAILED:
            case zookeeper.State.EXPIRED:
            case zookeeper.State.CONNECTED_READ_ONLY:
                isConnected = false;
                statusBar.text = '$(debug-disconnect) ZK: Disconnected';
                statusBar.tooltip = 'ZooKeeper Disconnected';
                vscode.window.showErrorMessage(`[Visual ZooKeeper]: Connection state turn to ${state}`);
                break;
            default:
                break;
        }
    });
    client.connect();
};


export const getChildren = (parent?: ZkNode): Promise<ZkNode[]> => {
    // state not connected, return empty list and show welcome content
    // see https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content
    if (!client) {
        return Promise.resolve([]);
    }

    if (client.getState() !== zookeeper.State.SYNC_CONNECTED) {
        console.error(`[Visual ZooKeeper]: getChildren failed, client state is  ${client.getState()}`);
        return Promise.resolve([]);
    }

    // add a root node here 
    if (!parent) {
        return Promise.resolve([new ZkNode(
            '/', '',
            vscode.TreeItemCollapsibleState.Collapsed,
            '/'
        )]);
    }
    return new Promise((resolve, reject) => {
        client?.getChildren(
            parent.fullPath,
            function (error, children, stat) {
                console.error(error);
                if (error) {
                    reject(error);
                }
                resolve(children.map(child => {
                    return new ZkNode(
                        child, '',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        parent.fullPath === '/' ? parent.fullPath + child : parent.fullPath + '/' + child
                    );
                }));
            }
        );
    });
};
