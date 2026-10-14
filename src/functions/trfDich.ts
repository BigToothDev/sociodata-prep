const FLAGS_DELIMITER = ',';

function trfDich(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('Scale sheet is missing');
        if (scaleSheet.getLastRow() < 2) return ui.alert('Scale sheet is empty');
        const scalesData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 3).getValues();

        const questionsSheet = spreadsheet.getSheetByName('questions');
        if (!questionsSheet) return ui.alert('Questions sheet is missing');
        if (questionsSheet.getLastRow() < 2) return ui.alert('Questions sheet is empty');
        const questionsData = questionsSheet.getRange(2, 1, questionsSheet.getLastRow() - 1, 5).getValues();

        if (activeSheet.getLastRow() < 2) return ui.alert('No data rows on the active sheet');
        const selectedCols = getSelectedColumns(activeSheet);
        const activeSheetHeaders = activeSheet
            .getRange(1, 1, 1, activeSheet.getLastColumn())
            .getValues()[0]
            .map(h => String(h).trim());
        const existingHeaders = new Set<string>(activeSheetHeaders);

        //create a map of options by set name
        const optionsBySet: Record<string, string[]> = {};
        scalesData.forEach(row => {
            const setName = String(row[0] ?? '').trim();
            const optionText = String(row[2] ?? '').trim();
            if (!setName || !optionText) return;
            (optionsBySet[setName] ??= []).push(optionText);
        });

        //create a merged map of questions and their corresponding options
        const mergedMap: { q: string; values: string[] }[] = questionsData
            .filter(row => String(row[2]).trim() === 'Flags')
            .map(row => ({
                q: String(row[1]).trim(),
                values: optionsBySet[String(row[3]).trim()] || [],
            }))
            .filter(item => item.q && item.values.length > 0);

        const dataRowsCount: number = activeSheet.getLastRow() - 1;
        const firstNewCol: number = activeSheet.getLastColumn() + 1;
        const newColumns: { header: string; data: string[] }[] = [];

        const colToDelete: number[] = [];
        activeSheetHeaders.forEach((header, colIndex) => {
            const colNum: number = colIndex + 1;
            if (!selectedCols.has(colNum)) return;
            const matchedScale: { q: string; values: string[] } | undefined =
                mergedMap.find(item => item.q === header);
            if (matchedScale) {
                colToDelete.push(colNum);
                const colData: string[][] = activeSheet.getRange(2, colNum, dataRowsCount).getValues() as string[][];
                matchedScale.values.forEach((scaleValue: string) => {
                    const newColHeader = `${header} [${scaleValue}]`;
                    if (existingHeaders.has(newColHeader)) return;
                    existingHeaders.add(newColHeader);
                    const newColData: string[] = colData.map(row => {
                        const cell = String(row[0] ?? '');

                        const selected: string[] = cell
                            .split(FLAGS_DELIMITER)
                            .map(s => s.trim())
                            .filter(Boolean);

                        if (scaleValue === "Other") {
                            const hasOther = selected.some(s => !matchedScale.values.includes(s));
                            return hasOther ? "TRUE" : "FALSE";
                        } else {
                            return selected.includes(scaleValue) ? "TRUE" : "FALSE";
                        }
                    });
                    newColumns.push({ header: newColHeader, data: newColData });
                });
            }
        });

        if (colToDelete.length === 0) {
            return ui.alert('Selected columns do not contain type Flags');
        }

        if (newColumns.length > 0) {
            const matrix: string[][] = [];
            matrix.push(newColumns.map(col => col.header));
            for (let r = 0; r < dataRowsCount; r++) {
                matrix.push(newColumns.map(col => col.data[r]));
            }
            activeSheet
                .getRange(1, firstNewCol, matrix.length, newColumns.length)
                .setValues(matrix);
            SpreadsheetApp.flush();
        }

        const button: GoogleAppsScript.Base.Button = ui.alert(
            "Do you want to delete parent columns?",
            ui.ButtonSet.YES_NO,
        );
        if (button == ui.Button.YES) {
            colToDelete.sort((a, b) => a - b);
            for (let i = 0; i < colToDelete.length; i++) {
                activeSheet.deleteColumn(colToDelete[i] - i);
            }
        } else {
            return ui.alert('Parent columns retained');
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}