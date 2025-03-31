import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
export const configFilePath = path.join(rootPath || "", "debug/config.ts");
const srcFolderPath = path.join(rootPath || "", "src/features/pos");

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

export async function readConfigFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        return {
            platform: "android",
            isRecord: false,
            isReset: false,
            isHeadless: false,
            environment: "",
            nodeInterpreter: "",
            nodeParameters: "",
            workingDirectory: "",
            javascriptFile: "",
            applicationParameter: ""
        };
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Regular expression to extract the values
    const platformMatch = content.match(/export const platform = '(.*)'/);
    const isRecordMatch = content.match(/export const isRecord = (true|false)/);
    const isResetMatch = content.match(/export const isReset = (true|false)/);
    const isHeadlessMatch = content.match(/export const isHeadless = (true|false)/);
    const environmentMatch = content.match(/export const environment = '(.*)'/);
    const nodeInterpreterMatch = content.match(/export const nodeInterpreter = '(.*)'/);
    const nodeParametersMatch = content.match(/export const nodeParameters = '(.*)'/);
    const workingDirectoryMatch = content.match(/export const workingDirectory = '(.*)'/);
    const javascriptFileMatch = content.match(/export const javascriptFile = '(.*)'/);
    const applicationParameterMatch = content.match(/export const applicationParameter = '(.*)'/);

    return {
        platform: platformMatch ? platformMatch[1] : "android",
        isRecord: isRecordMatch ? isRecordMatch[1] === "true" : false,
        isReset: isResetMatch ? isResetMatch[1] === "true" : false,
        isHeadless: isHeadlessMatch ? isHeadlessMatch[1] === "true" : false,
        environment: environmentMatch ? environmentMatch[1] : "",
        nodeInterpreter: nodeInterpreterMatch && nodeInterpreterMatch[1] !== '' ? nodeInterpreterMatch[1] : "/opt/homebrew/bin/node",
        nodeParameters: nodeParametersMatch ? nodeParametersMatch[1] : "",
        workingDirectory: workingDirectoryMatch && workingDirectoryMatch[1] !== '' ? workingDirectoryMatch[1] : rootPath,
        javascriptFile: javascriptFileMatch ? javascriptFileMatch[1] : "",
        applicationParameter: applicationParameterMatch ? applicationParameterMatch[1] : "",
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
    // Read the existing content of the configuration file
    let content = fs.readFileSync(filePath, "utf8");

    // Regular expressions to find the lines to update
    const platformRegex = /export const platform = '[a-zA-Z\-]+';/;
    const isRecordRegex = /export const isRecord = (true|false);/;
    const isResetRegex = /export const isReset = (true|false);/;
    const isHeadlessRegex = /export const isHeadless = (true|false);/;
    const environmentRegex = /export const environment = '.*?';/;
    const nodeInterpreterRegex = /export const nodeInterpreter = '.*?';/;
    const nodeParametersRegex = /export const nodeParameters = '.*?';/;
    const workingDirectoryRegex = /export const workingDirectory = '.*?';/;
    const javascriptFileMatchRegex = /export const javascriptFileMatch = '.*?';/;
    const applicationParameterRegex = /export const applicationParameter = '.*?';/;

    // Replace the relevant lines with the new values
    content = content.replace(platformRegex, `export const platform = '${data.platform}';`);
    content = content.replace(isRecordRegex, `export const isRecord = ${data.isRecord};`);
    content = content.replace(isResetRegex, `export const isReset = ${data.isReset};`);
    content = content.replace(isHeadlessRegex, `export const isHeadless = ${data.isHeadless};`);
    content = content.replace(environmentRegex, `export const environment = '${data.environment}';`);
    content = content.replace(nodeInterpreterRegex, `export const nodeInterpreter = '${data.nodeInterpreter}';`);
    content = content.replace(nodeParametersRegex, `export const nodeInterpreter = '${data.nodeParameters}';`);
    content = content.replace(workingDirectoryRegex, `export const nodeInterpreter = '${data.workingDirectory}';`);
    content = content.replace(javascriptFileMatchRegex, `export const nodeInterpreter = '${data.javascriptFileMatch}';`);
    content = content.replace(applicationParameterRegex, `export const nodeInterpreter = '${data.applicationParameter}';`);


    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, "utf8");
}


function getWebviewContent(config: any, featureFiles: string[]) {
    return `
    <!DOCTYPE html>
    <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: "Arial", sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
            margin: 0;
          }
          h2 {
            font-size: 24px;
            color: #333;
          }
          .form-container {
            margin-top: 20px;
          }
          .form-group {
            display: flex;
            align-items: center;
            margin-top: 15px;
          }
          label {
            font-size: 16px;
            color: #333;
            width: 250px;
            margin-right: 10px;
          }
          .radio-group {
            display: flex;
            gap: 10px;
          }
          select, input[type="radio"], input[type="text"] {
            font-size: 14px;
            padding: 5px;
            margin-left: 5px;
          }
          /* Set the input fields to the same width as the select dropdown */
          input[type="text"] {
            width: 200px; /* Adjust this value to match your dropdown width */
          }
        </style>
      </head>
      <body>
        <h2>修改环境配置</h2>
        <div class="form-container">
          <!-- Platform selection -->
          <div class="form-group">
            <label>请选择运行平台：</label>
            <div class="radio-group">
              <input type="radio" name="platform" value="android" ${config.platform === "android" ? "checked" : ""}> Android
              <input type="radio" name="platform" value="ios" ${config.platform === "ios" ? "checked" : ""}> iOS
            </div>
          </div>

          <!-- Recording option -->
          <div class="form-group">
            <label>是否录像：</label>
            <div class="radio-group">
              <input type="radio" name="isRecord" value="true" ${config.isRecord ? "checked" : ""}> 是
              <input type="radio" name="isRecord" value="false" ${!config.isRecord ? "checked" : ""}> 否
            </div>
          </div>

          <!-- Reset session option -->
          <div class="form-group">
            <label>是否重启会话：</label>
            <div class="radio-group">
              <input type="radio" name="isReset" value="true" ${config.isReset ? "checked" : ""}> 是
              <input type="radio" name="isReset" value="false" ${!config.isReset ? "checked" : ""}> 否
            </div>
          </div>

          <!-- Headless mode option -->
          <div class="form-group">
            <label>是否无头模式运行：</label>
            <div class="radio-group">
              <input type="radio" name="isHeadless" value="true" ${config.isHeadless ? "checked" : ""}> 是
              <input type="radio" name="isHeadless" value="false" ${!config.isHeadless ? "checked" : ""}> 否
            </div>
          </div>

          <!-- File selection (environment) -->
          <div class="form-group">
            <label>请选择文件：</label>
            <select name="featureFile">
              ${featureFiles.map((file) => {
        const fileNameWithoutExtension = file.replace(".feature", "");
        return `
                  <option value="${fileNameWithoutExtension}" 
                    ${config.environment && config.environment === fileNameWithoutExtension ? "selected" : ""}>
                    ${fileNameWithoutExtension}
                  </option>
                `;
    }).join('')}
            </select>
          </div>

          <!-- Spacer for visual separation -->
          <div style="margin-top: 20px;"></div>

          <!-- Node Interpreter -->
          <div class="form-group">
            <label for="nodeInterpreter">Node Interpreter:</label>
            <input type="text" name="nodeInterpreter" value="${config.nodeInterpreter}">
          </div>

          <!-- Node Parameters -->
          <div class="form-group">
            <label for="nodeParameters">Node Parameters:</label>
            <input type="text" name="nodeParameters" value="${config.nodeParameters}">
          </div>

          <!-- Working Directory -->
          <div class="form-group">
            <label for="workingDirectory">Working Directory:</label>
            <input type="text" name="workingDirectory" value="${config.workingDirectory}">
          </div>

          <!-- Javascript File -->
          <div class="form-group">
            <label for="javascriptFile">Javascript File:</label>
            <input type="text" name="javascriptFile" value="${config.javascriptFile}">
          </div>

          <!-- Application Parameter -->
          <div class="form-group">
            <label for="applicationParameter">Application Parameter:</label>
            <input type="text" name="applicationParameter" value="${config.applicationParameter}">
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function updateConfig() {
            const platform = document.querySelector('input[name="platform"]:checked').value;
            const isRecord = document.querySelector('input[name="isRecord"]:checked').value === "true";
            const isReset = document.querySelector('input[name="isReset"]:checked').value === "true";
            const isHeadless = document.querySelector('input[name="isHeadless"]:checked').value === "true";
            const featureFile = document.querySelector('select[name="featureFile"]').value;
            const nodeInterpreter = document.querySelector('input[name="nodeInterpreter"]').value;
            const nodeParameters = document.querySelector('input[name="nodeParameters"]').value;
            const workingDirectory = document.querySelector('input[name="workingDirectory"]').value;
            const javascriptFile = document.querySelector('input[name="javascriptFile"]').value;
            const applicationParameter = document.querySelector('input[name="applicationParameter"]').value;

            vscode.postMessage({
              command: "saveConfig",
              data: { 
                platform, 
                isRecord, 
                isReset, 
                isHeadless, 
                environment: featureFile, 
                nodeInterpreter, 
                nodeParameters, 
                workingDirectory, 
                javascriptFile, 
                applicationParameter
              }
            });
          }

          document.querySelectorAll('input[type="radio"], select, input[type="text"]').forEach((element) => {
            element.addEventListener('change', updateConfig);
          });
        </script>
      </body>
    </html>
  `;
}
