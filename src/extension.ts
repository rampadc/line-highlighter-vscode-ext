
import { group } from 'console';
import * as vscode from 'vscode';

const dimmedDecoration = vscode.window.createTextEditorDecorationType({
	opacity: '0.5'
});
const normalDecoration = vscode.window.createTextEditorDecorationType({
	opacity: '1'
});

function hasFailedValidation(text: string): boolean {
	return text.match(/[^\d\-,]+/) !== null;
}

function range(start: number, end: number): number[] {
	if (start > end) {
		return [];
	}

	if (start === end) {
		return [start];
	}
	
	return [start, ...range(start + 1, end)];
}

function getRangeFromText(text: string): number[] {
	const regex = /(\d+)-(\d+)/gm;
	let m: RegExpExecArray | null;

	let results: number[] = [];

	while ((m = regex.exec(text)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if ((m as RegExpExecArray).index === regex.lastIndex) {
			regex.lastIndex++;
		}
		
		// The result can be accessed through the `m`-variable.
		m.forEach((match, groupIndex) => {
			if (groupIndex > 0) {
				results.push(parseInt(match));
			}
		});
	}

	if (results.length === 0) {
		results = [parseInt(text) - 1];
	} else {
		results = [...range(results[0] - 1, results[1] - 1)];
	}
	return results;
} 

function dimEditor(lines: Set<number>) {
	const activeEditor = vscode.window.activeTextEditor;
	const activeDocument = activeEditor?.document;

	const allLines = range(0, activeDocument!.lineCount);
	const dimmedLines = allLines.filter(value => {
		return !lines.has(value);
	});

	console.log(dimmedLines);

	let ranges: vscode.Range[] = [];
	dimmedLines.forEach(line => {
		ranges.push(new vscode.Range(
			new vscode.Position(line, 0),
			new vscode.Position(line, Number.MAX_VALUE)
		));
	});

	activeEditor?.setDecorations(dimmedDecoration, ranges);
}

function highlight(lines: Set<number>) {
	dimEditor(lines);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) { 
	let disposable = vscode.commands.registerCommand('line-highlighter.highlight-lines', async () => {
		const highlightInput = await vscode.window.showInputBox({
			placeHolder: "1,5-9,13",
			prompt: "Validation fails if text match regex: [^\d\-,]+",
			validateInput: text => {
				return hasFailedValidation(text) ? "Input text failed validation" : "";
			}
		});

		if (highlightInput !== null) {
			const linesToHighlightInput = highlightInput!.split(',');
			let linesToHighlight: number[] = [];
			for (let i = 0; i < linesToHighlightInput.length; i++) {
				const lineText = linesToHighlightInput[i];
				const range = getRangeFromText(lineText);
				linesToHighlight = linesToHighlight.concat(range);
			}

			const setOfLinesToHighlight = new Set(linesToHighlight);
			highlight(setOfLinesToHighlight);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
