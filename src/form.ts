import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const configFilePath = path.join(vscode.workspace.rootPath || "", "debug/config.ts");
const srcFolderPath = path.join(vscode.workspace.rootPath || "", "src/features/pos");

export async function showConfigWebview() {
    const panel = vscode.window.createWebviewPanel(
        "configWebview",
        "修改环境配置",
        vscode.ViewColumn.One,
        {
            enableScripts: true, // 允许 JavaScript
        }
    );

    // 读取并解析 config.ts
    const config = await readConfigFile(configFilePath);

    // 获取所有 .feature 文件
    const featureFiles = getFeatureFiles(srcFolderPath);

    // 生成 HTML
    panel.webview.html = getWebviewContent(config, featureFiles);

    // 监听 Webview 消息
    panel.webview.onDidReceiveMessage(
        (message) => {
            if (message.command === "saveConfig") {
                saveConfigFile(configFilePath, message.data);
                vscode.window.showInformationMessage("配置已保存");
            }
        },
        undefined,
        []
    );
}

async function readConfigFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        return { platform: "android", isRecord: false, isReset: false };
    }
    const content = fs.readFileSync(filePath, "utf8");

    return {
        platform: content.includes("platform = 'ios'") ? "ios" : "android",
        isRecord: content.includes("isRecord = true"),
        isReset: content.includes("isReset = true"),
    };
}


function getFeatureFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) {
        return results;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(getFeatureFiles(filePath));
        } else if (file.endsWith(".feature")) {
            results.push(file);
        }
    }
    return results;
}


function saveConfigFile(filePath: string, data: any) {
    const newContent = `export const platform = '${data.platform}';
export const isRecord = ${data.isRecord};
export const isReset = ${data.isReset};`;

    fs.writeFileSync(filePath, newContent, "utf8");
}


function getWebviewContent(config: any, featureFiles: string[]) {
    return `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; padding: 10px; }
          label { display: block; margin-top: 10px; }
          select, input { margin-left: 10px; }
          button { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>修改环境配置</h2>
  
        <label>请选择运行平台：
          <input type="radio" name="platform" value="android" ${config.platform === "android" ? "checked" : ""}> Android
          <input type="radio" name="platform" value="ios" ${config.platform === "ios" ? "checked" : ""}> iOS
        </label>
  
        <label>是否录像：
          <input type="radio" name="isRecord" value="true" ${config.isRecord ? "checked" : ""}> 是
          <input type="radio" name="isRecord" value="false" ${!config.isRecord ? "checked" : ""}> 否
        </label>
  
        <label>是否重启会话：
          <input type="radio" name="isReset" value="true" ${config.isReset ? "checked" : ""}> 是
          <input type="radio" name="isReset" value="false" ${!config.isReset ? "checked" : ""}> 否
        </label>
  
        <label>请选择运行文件夹：
          <select id="featureFiles">
            ${featureFiles.map((file) => `<option value="${file}">${file}</option>`).join("")}
          </select>
        </label>
  
        <button id="cancel">Cancel</button>
        <button id="ok">OK</button>
  
        <script>
          const vscode = acquireVsCodeApi();
  
          document.getElementById("ok").addEventListener("click", () => {
            const platform = document.querySelector('input[name="platform"]:checked').value;
            const isRecord = document.querySelector('input[name="isRecord"]:checked').value === "true";
            const isReset = document.querySelector('input[name="isReset"]:checked').value === "true";
  
            vscode.postMessage({
              command: "saveConfig",
              data: { platform, isRecord, isReset }
            });
          });
  
          document.getElementById("cancel").addEventListener("click", () => {
            vscode.postMessage({ command: "cancel" });
          });
        </script>
      </body>
      </html>
    `;
}

