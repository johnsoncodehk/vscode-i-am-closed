import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const selectionEventEmitter = new vscode.EventEmitter<void>();

	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(e => {
		selectionEventEmitter.fire();
	}));

	context.subscriptions.push(vscode.languages.registerInlayHintsProvider({ scheme: '*' }, {

		onDidChangeInlayHints: selectionEventEmitter.event,

		async provideInlayHints(document, range, token) {

			if (vscode.window.activeTextEditor?.document !== document) {
				return;
			}

			const editor = vscode.window.activeTextEditor;
			const foldingRanges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
				'_executeFoldingRangeProvider',
				document.uri,
			) ?? [];
			const result: vscode.InlayHint[] = [];

			for (const foldingRange of foldingRanges) {

				if (token.isCancellationRequested) {
					return;
				}
				if (foldingRange.end < range.start.line || foldingRange.end > range.end.line) {
					continue;
				}

				const selectedLine = editor.selection.active.line === foldingRange.end;
				const selectedLastCharacter = editor.selection.active.character === editor.document.lineAt(foldingRange.end).range.end.character;
				const isValidSelected = selectedLine && !selectedLastCharacter;
				if (!isValidSelected) {
					continue;
				}

				const startLine = document.lineAt(foldingRange.start - 1);
				const endLine = document.lineAt(foldingRange.end);

				result.push({
					label: startLine.text.trimStart(),
					position: endLine.range.end,
					paddingLeft: true,
				});
			}

			return result;
		}
	}));
}
