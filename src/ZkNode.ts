import path = require('path');
import * as vscode from 'vscode';
import { ThemeIcon } from 'vscode';
import { zkPathToFileName } from './zkFileSystemProvider';
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
        this.resourceUri = vscode.Uri.parse("zkfs:/" + zkPathToFileName(this.fullPath));
        // this.iconPath = new ThemeIcon("circle-filled");
    }
    contextValue = "zkNode";
}