"use strict";
import * as fs from "fs";
import * as os from "os";
import { dirname } from "path";
import * as vscode from "vscode";

const TmpDir = os.tmpdir();
let outputChannel: vscode.OutputChannel =
  vscode.window.createOutputChannel("Code");
let terminal: vscode.Terminal = null;
let isRunning: boolean = false;
let process;
let pid;
let codeFile: string;
let isTmpFile: boolean;
let cwd: string;
let document: vscode.TextDocument;
let workspaceFolder: string;
let config: vscode.WorkspaceConfiguration;

export function OnDidCloseTerminal(): void {
  terminal = null;
}

export async function Run() {
  if (isRunning) {
    Stop();
  }

  Initialize();

  const executor = '/opt/homebrew/bin/node node_modules/@wdio/cli/bin/wdio.js test.conf.ts';

  ExecuteCommandInOutputChannel(executor);
}

export async function DebugRun() {
    if (isRunning) {
      Stop();
    }
  
    Initialize();
  
    const executor = '/opt/homebrew/bin/node node_modules/@wdio/cli/bin/wdio.js test.conf.ts';
  
    ExecuteCommandInTerminal(executor);
  }

export function Stop(): void {
  StopRunning();
}

export function Dispose() {
  StopRunning();
}

function StopRunning() {
  if (isRunning) {
    isRunning = false;
    vscode.commands.executeCommand(
      "setContext",
      "code-runner.codeRunning",
      false,
    );
    const kill = require("tree-kill");
    if(process) kill(process.pid);
    if(pid) kill(pid);
  }
}

function Initialize(): void {
  config = GetConfiguration("code-runner");
  cwd = config.get<string>("cwd");
  if (cwd) {
    return;
  }
  workspaceFolder = GetWorkspaceFolder();
  if (
    (config.get<boolean>("fileDirectoryAsCwd") || !workspaceFolder) &&
    document &&
    !document.isUntitled
  ) {
    cwd = dirname(document.fileName);
  } else {
    cwd = workspaceFolder;
  }
  if (cwd) {
    return;
  }
  cwd = TmpDir;
}

function GetConfiguration(section?: string): vscode.WorkspaceConfiguration {
  return UtilityGetConfiguration(section, document);
}

function GetWorkspaceFolder(): string {
  if (vscode.workspace.workspaceFolders) {
    if (document) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (workspaceFolder) {
        return workspaceFolder.uri.fsPath;
      }
    }
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    return undefined;
  }
}

async function ExecuteCommandInTerminal(
  executor: string,
  appendFile: boolean = true,
) {
  let isNewTerminal = false;
  if (terminal === null) {
    terminal = vscode.window.createTerminal("Code");
    isNewTerminal = true;
  }
  terminal.show(config.get<boolean>("preserveFocus"));
  isRunning = true;
  terminal.sendText(executor);
  pid = await terminal.processId;
}

async function ExecuteCommandInOutputChannel(
  executor: string,
  appendFile: boolean = true,
) {
  isRunning = true;
  vscode.commands.executeCommand("setContext", "code-runner.codeRunning", true);
  const clearPreviousOutput = config.get<boolean>("clearPreviousOutput");
  if (clearPreviousOutput) {
    outputChannel.clear();
  }
  const showExecutionMessage = config.get<boolean>("showExecutionMessage");
  outputChannel.show(config.get<boolean>("preserveFocus"));
  const spawn = require("child_process").spawn;
  const command = executor;
  if (showExecutionMessage) {
    outputChannel.appendLine("[Running] " + command);
  }
  const startTime = new Date();
  process = spawn(command, [], { cwd: cwd, shell: true });

  process.stdout.on("data", (data) => {
    outputChannel.append(data.toString());
  });

  process.stderr.on("data", (data) => {
    outputChannel.append(data.toString());
  });

  process.on("close", (code) => {
    isRunning = false;
    vscode.commands.executeCommand(
      "setContext",
      "code-runner.codeRunning",
      false,
    );
    const endTime = new Date();
    const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;
    outputChannel.appendLine("");
    if (showExecutionMessage) {
      outputChannel.appendLine(
        "[Done] exited with code=" + code + " in " + elapsedTime + " seconds",
      );
      outputChannel.appendLine("");
    }
    if (isTmpFile) {
      fs.unlinkSync(codeFile);
    }
  });
}

export function UtilityGetConfiguration(
  section?: string,
  document?: vscode.TextDocument,
): vscode.WorkspaceConfiguration {
  if (document) {
    return vscode.workspace.getConfiguration(section, document.uri);
  } else {
    return vscode.workspace.getConfiguration(section);
  }
}

export function showConfigQuickPick() {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = "修改环境配置";
  quickPick.placeholder = "选择运行平台";

  quickPick.items = [
    { label: "请选择运行平台", alwaysShow: true },
    { label: "ios", picked: true },
    { label: "android" },
    { label: "——", kind: vscode.QuickPickItemKind.Separator },
    { label: "是否录像", alwaysShow: true },
    { label: "是", picked: true },
    { label: "否" },
    { label: "——", kind: vscode.QuickPickItemKind.Separator },
    { label: "是否重启会话", alwaysShow: true },
    { label: "是", picked: true },
    { label: "否" },
    { label: "——", kind: vscode.QuickPickItemKind.Separator },
    { label: "请选择运行文件夹", alwaysShow: true },
    { label: "A", picked: true },
    { label: "B" },
    { label: "C" },
  ];

  quickPick.canSelectMany = false;
  quickPick.onDidAccept(() => {
    const selections = quickPick.selectedItems.map((item) => item.label);

    vscode.workspace.getConfiguration("code-runner").update("selectedPlatform", selections[0], vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration("code-runner").update("recording", selections[1], vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration("code-runner").update("restartSession", selections[2], vscode.ConfigurationTarget.Global);
    vscode.workspace.getConfiguration("code-runner").update("selectedFolder", selections[3], vscode.ConfigurationTarget.Global);

    quickPick.dispose();
    vscode.window.showInformationMessage("配置已应用");
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}