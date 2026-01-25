"use strict";
function numRecodeWide() {
    const context = getSheetContext();
    if (!context)
        return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const inputAll = activeSheet.getDataRange().getValues();
        const inputHeaders = inputAll[0];
        const inputData = inputAll.slice(1);
        const recodedSheet = activeSheet.copyTo(spreadsheet).setName(`${activeSheet.getName()}_recoded`);
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet)
            return ui.alert('No scales sheet found');
        const scaleHeaders = scaleSheet.getRange(1, 1, 1, scaleSheet.getLastColumn()).getValues()[0];
        const scaleCols = ['Question', 'Option', 'Code'];
        const scaleIndices = scaleCols.map(col => scaleHeaders.indexOf(col));
        if (scaleIndices.includes(-1))
            return ui.alert('Missing some of input columns');
        const [qIndex, optIndex, codeIndex] = scaleIndices;
        const scaleData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, scaleSheet.getLastColumn()).getValues();
        const scaleMap = {};
        for (const row of scaleData) {
            const q = String(row[qIndex]);
            const opt = String(row[optIndex]);
            const code = Number(row[codeIndex]);
            if (!scaleMap[q])
                scaleMap[q] = {};
            scaleMap[q][opt] = code;
        }
        const recode_col_indices = inputHeaders.map((h, idx) => scaleMap[h] ? idx : -1).filter(i => i !== -1);
        for (let r = 0; r < inputData.length; r++) {
            for (const c of recode_col_indices) {
                const col_name = inputHeaders[c];
                const cell_value = inputData[r][c];
                const code = scaleMap[col_name][cell_value];
                inputData[r][c] = code !== undefined ? code : -99;
            }
        }
        recodedSheet.getRange(2, 1, inputData.length, inputHeaders.length).setValues(inputData);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}
