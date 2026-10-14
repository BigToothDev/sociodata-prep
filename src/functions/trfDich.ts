const FLAGS_DELIMITER = ',';

function trfDich(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('Scale sheet is missing');
        const scalesData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 2).getValues();

        const questionsSheet = spreadsheet.getSheetByName('questions');
        if (!questionsSheet) return ui.alert('Questions sheet is missing');
        const questionsData = questionsSheet.getRange(2, 1, questionsSheet.getLastRow() - 1, 5).getValues();

        const activeSheetHeaders = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues() as string[][];
        
        //create a map of options by set name
        const optionsBySet: Record<string, string[]> = {};
        scalesData.forEach(row => {
            const setName = String(row[0]).trim();
            const optionText = String(row[2]).trim();
            if (!setName || !optionText) return;
            if (!optionsBySet[setName]) optionsBySet[setName] = [];
            optionsBySet[setName].push(optionText);
        });

        //create a merged map of questions and their corresponding options
        const mergedMap: { q: string; values: string[] }[] = questionsData
            .filter(row => String(row[2]).trim() === 'Flags')
            .map(row => ({
                q: String(row[1]).trim(),
                values: optionsBySet[String(row[3]).trim()] || [],
            }))
            .filter(item => item.q && item.values.length > 0);
        
        const colToDelete: number[] = [];
        activeSheetHeaders[0].forEach((header, colIndex) => {
            const matchedScale: { q: string; values: string[] } | undefined =
                mergedMap.find(item => item.q === String(header).trim());
            if (matchedScale) {
                const colNum: number = colIndex + 1;
                colToDelete.push(colNum);
                const colData: string[][] = activeSheet.getRange(2, colNum, activeSheet.getLastRow() - 1).getValues() as string[][];
                matchedScale.values.forEach((scaleValue: string) => {
                    const newColIndex: number = activeSheet.getLastColumn() + 1;
                    const newColHeader = `${header} [${scaleValue}]`;
                    const newColData: string[][] = colData.map(row => {
                        const cell = String(row[0] || '');

                        const selected: string[] = cell
                            .split(FLAGS_DELIMITER)
                            .map(s => s.trim())
                            .filter(Boolean);

                        if (scaleValue === "Other") {
                            const hasOther = selected.some(s => !matchedScale.values.includes(s));
                            return [hasOther ? "TRUE" : "FALSE"];
                        } else {
                            return [selected.includes(scaleValue) ? "TRUE" : "FALSE"];
                        }
                    });
                    activeSheet.getRange(1, newColIndex).setValue(newColHeader);
                    activeSheet.getRange(2, newColIndex, newColData.length, 1).setValues(newColData);
                });
            }
        });
        const button: GoogleAppsScript.Base.Button = ui.alert(
            "Do you want to delete parent columns?",
            ui.ButtonSet.YES_NO,
        );
        if (button == ui.Button.YES) {
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