const vscode = require('vscode');

class SidebarProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'explainCode':
                    const explainCodeResponse = await this._postRequest('http://localhost:5000/explain-code', { code: message.prompt });
                    webviewView.webview.postMessage({ command: 'showExplanation', explanation: explainCodeResponse });
                    break;
                case 'generateCode':
                    const generateCodeResponse = await this._postRequest('http://localhost:5000/generate-code', { query: message.prompt });
                    webviewView.webview.postMessage({ command: 'showGeneratedCode', code: generateCodeResponse });
                    break;
            }
        });
    }

    _getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
        );

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Planto.AI</title>
        </head>
        <body>
            <h1>Planto.AI</h1>
            <textarea id="prompt" rows="5" placeholder="Enter your prompt here..."></textarea>
            <div>
                <button id="explain">Explain Code</button>
                <button id="generate">Generate Code</button>
            </div>
            <div id="response" style="white-space: pre-wrap; margin-top: 20px;"></div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('explain').addEventListener('click', () => {
                    const prompt = document.getElementById('prompt').value;
                    vscode.postMessage({ command: 'explainCode', prompt: prompt });
                });
                document.getElementById('generate').addEventListener('click', () => {
                    const prompt = document.getElementById('prompt').value;
                    vscode.postMessage({ command: 'generateCode', prompt: prompt });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    const responseDiv = document.getElementById('response');
                    if (message.command === 'showExplanation') {
                        responseDiv.innerHTML = message.explanation;
                    } else if (message.command === 'showGeneratedCode') {
                        responseDiv.textContent = message.code;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    async _postRequest(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return result;
    }
}

module.exports = SidebarProvider;
