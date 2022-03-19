import * as vscode from 'vscode';
import *  as zkClient from './ZkClient';
import * as zookeeper from 'node-zookeeper-client';

/**
 * bridge file save and read to zk server.
 * inspired by https://github.com/microsoft/vscode-extension-samples/tree/main/fsprovider-sample
 */

export const BIG_SOLIDUS = "⧸";

export class File implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export const zkPathToFileName = (zkPath: string) => {
    return '/' + zkPath.split("/").join(BIG_SOLIDUS);
};

const fileNameToZkPath = (fileName: string) => {
    return fileName.substring(1).split("⧸").join("/");
};

export type Entry = File | Directory;

export class ZkFS implements vscode.FileSystemProvider {

    root = new Directory('');

    // --- manage file metadata, vs code call state before read.
    stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        console.log("state: " + uri.path);
        let zkPath = fileNameToZkPath(uri.path);
        return new Promise((resolve, reject) => {
            zkClient.client?.getData(
                zkPath,
                function (error: any, data: any, stat: zookeeper.Stat) {
                    if (error) {
                        console.log("state file faild: " + error);
                        reject(error);
                    }
                    let file = new File(zkPath);
                    // amazing! 
                    file.ctime = stat.ctime;
                    file.mtime = stat.mtime;
                    file.name = zkPath;
                    file.size = stat.dataLength;
                    file.type = vscode.FileType.File;
                    console.log("read file success , data: " + data);
                    resolve(data);
                }
            );
        });
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        throw vscode.FileSystemError.Unavailable(uri);
    }

    // --- manage file contents
    readFile(uri: vscode.Uri): Promise<Uint8Array> {
        let path = uri.path.substring(1).split("⧸").join("/");
        return new Promise((resolve, reject) => {
            zkClient.client?.getData(
                path,
                function (error: any, data: any, stat: any) {
                    if (error) {
                        console.log("read file faild: " + error);
                        reject(error);
                    }
                    console.log("read file success , data: " + data);
                    resolve(data);
                }
            );
        });
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
        let zkPath = fileNameToZkPath(uri.path);
        let that = this;
        return new Promise((resolve, reject) => {
            zkClient.client?.setData(
                zkPath,
                Buffer.from(content),
                function (error: any, stat: any) {
                    if (error) {
                        vscode.window.showErrorMessage('[Visual ZooKeeper] Failed to update zk node: ' + zkPath);
                        reject(error);
                    }
                    vscode.window.showInformationMessage('[Visual ZooKeeper] Successfully updated zk node: ' + zkPath);
                    that._fireSoon({ type: vscode.FileChangeType.Changed, uri });
                    resolve();
                }
            );
        });
    }

    // --- manage files/folders
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
        throw vscode.FileSystemError.Unavailable(newUri);
    }

    delete(uri: vscode.Uri): void {
        throw vscode.FileSystemError.Unavailable(uri);
    }

    createDirectory(uri: vscode.Uri): void {
        throw vscode.FileSystemError.Unavailable(uri);
    }

    // TODO --- manage file events 
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    watch(_resource: vscode.Uri): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }

        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
}
