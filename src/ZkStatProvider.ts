import * as zookeeper from 'node-zookeeper-client';
import * as vscode from 'vscode';
import * as zkClient from './ZkClient';


function bufferToInt(longBuffer: Buffer) {
    var hexString = longBuffer.toString('hex');
    return parseInt(hexString, 16);
}

function bufferToDate(longBuffer: Buffer) {
    var hexString = longBuffer.toString('hex');
    var msSinceEpoch = parseInt(hexString, 16);
    return new Date(msSinceEpoch).toString();
}

/**
 * readonly preview for node content!. 
 */
export default class ZkStatProvider implements vscode.TextDocumentContentProvider {

    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return new Promise((resolve, reject) => {
            if (!zkClient.client || !zkClient.isConnected) {
                reject("[Visual ZooKeeper]: client is not connected!");
            }
            let path = uri.path.replace(' > stat.json', '');
            zkClient.client?.getData(
                path,
                function (error: any, data: any, stat: zookeeper.Stat) {
                    if (error) {
                        reject(error);
                    }
                    let statObject = {
                        // @ts-expect-error
                        cZxid: bufferToInt(stat.czxid),
                        // @ts-expect-error
                        ctime: bufferToDate(stat.ctime),
                        // @ts-expect-error
                        mZxid: bufferToInt(stat.mzxid),
                        // @ts-expect-error
                        mtime: bufferToDate(stat.mtime),
                        // @ts-expect-error
                        pZxid: bufferToInt(stat.pzxid),
                        dataVersion: stat.version,
                        cVersion: stat.cversion,
                        aclVersion: stat.aversion,
                        // @ts-expect-error
                        ephemeralOwner: bufferToInt(stat.ephemeralOwner),
                        dataLength: stat.dataLength,
                        numChildren: stat.numChildren,
                    };

                    resolve(JSON.stringify(statObject, null, '    '));
                }
            );
        });
    }
}