import * as zookeeper from 'node-zookeeper-client';
import * as vscode from 'vscode';
import { ZkNode } from './ZkNode';

let initingConnection = false;
export let client: zookeeper.Client;

const createConnection = (server: string) => {
    client = zookeeper.createClient(server);
    initingConnection = true;
    client.once('connected', () => {
        vscode.window.showInformationMessage('[Visual ZooKeeper]: Connected to ' + server);
        console.log('[Visual ZooKeeper]: Connected to ' + server); '';
        initingConnection = false;
        // refresh nodes after connected!;
        vscode.commands.executeCommand("visualZooKeeper.refreshNode");
    });
    client.connect();
};


createConnection("localhost:2181");

export const getChildren = (parent?: ZkNode): Promise<ZkNode[]> => {
    console.log("[Visual ZooKeeper]: client state is " + client.getState());
    // initingConnection return empty list and wait for refresh event. 
    if (initingConnection) {
        return Promise.resolve([]);
    }

    // if client is not connected, throw a error
    if (client.getState() !== zookeeper.State.SYNC_CONNECTED) {
        return Promise.reject('[Visual ZooKeeper]: get nodes failed, connection state is ' + client.getState());
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
        client.getChildren(
            parent.fullPath,
            function (error, children, stat) {
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
