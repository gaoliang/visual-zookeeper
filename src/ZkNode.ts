import * as vscode from 'vscode';
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