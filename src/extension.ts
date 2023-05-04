import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const selectionEventEmitter = new vscode.EventEmitter<void>();

	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(e => {
		selectionEventEmitter.fire();
	}));

	context.subscriptions.push(vscode.languages.registerInlayHintsProvider({ scheme: '*' }, {

		onDidChangeInlayHints: selectionEventEmitter.event,

		async provideInlayHints(document) {

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

				const cantSeeStartBlock = editor.visibleRanges.every(range =>
					foldingRange.end - foldingRange.start > range.end.line - range.start.line
				);
				const selectedLine = editor.selection.active.line === foldingRange.end;

				if (vscode.workspace.getConfiguration('iAmClosed').get('showOnlySelectedLine')) {
					if (!selectedLine) {
						continue;
					}
				}
				else {
					if (!cantSeeStartBlock && !selectedLine) {
						continue;
					}
				}

				const startLine = document.lineAt(foldingRange.start - 1);
				const endLine = document.lineAt(foldingRange.end);

				let text = startLine.text.trimStart();

				if (text.length >= 33) {
					text = text.slice(0, 30) + '...';
				}

				result.push({
					label: text,
					position: endLine.range.end,
					paddingLeft: true,
				});
			}

			return result;
		}
	}));
}
