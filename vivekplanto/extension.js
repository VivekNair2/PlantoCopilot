const vscode = require('vscode');
const SidebarProvider = require('./sidebarProvider');

function activate(context) {
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("planto-sidebar", sidebarProvider)
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
