"use strict";
import * as vscode from "vscode";
import {
    OnDidCloseTerminal,
    Run,
    Stop,
    Dispose,
    DebugRun,
    showConfigQuickPick,
} from "./main";
import {showConfigWebview} from "./form";

export function activate(context: vscode.ExtensionContext) {
    vscode.window.onDidCloseTerminal(() => {
        OnDidCloseTerminal();
    });

    const run = vscode.commands.registerCommand(
        "code-runner.run",
        () => {
            Run();
        },
    );

    const debug = vscode.commands.registerCommand(
        "code-debug-runner.run",
        () => {
            DebugRun();
        },
    );

    const stop = vscode.commands.registerCommand("code-runner.stop", () => {
        Stop();
    });

    const showConfig = vscode.commands.registerCommand("code-runner.config", () => {
        // showConfigQuickPick();
        showConfigWebview();
    });

    context.subscriptions.push(run);
    context.subscriptions.push(debug);
    context.subscriptions.push(stop);
    context.subscriptions.push(showConfig);
}

export function deactivate() {
    Dispose();
}
