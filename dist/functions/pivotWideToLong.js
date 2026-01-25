"use strict";
const PIVOT_SHEET_PREFIX = 'pivot_';
function pivotWideToLong() {
    const context = getSheetContext();
    if (!context)
        return;
    const { ui, spreadsheet, activeSheet } = context;
    const dialogueGetIdCol = ui.prompt("Pivot Table", "Convert from wide to long format. Type the column number containing respondent IDs\nIt is recommended to use this on a sheet after running the 'Add Response IDs' function", ui.ButtonSet.OK_CANCEL);
    const input = dialogueGetIdCol.getResponseText();
    const inputIdCol = parseInt(input);
    const buttons = dialogueGetIdCol.getSelectedButton();
    if (buttons == ui.Button.OK) {
        if (!inputIdCol)
            return ui.alert('Incorrect ID column number');
        if (spreadsheet.getSheetByName(PIVOT_SHEET_PREFIX + activeSheet.getName()))
            return ui.alert('A pivot sheet already exists for this sheet');
        const pivotSheet = spreadsheet.insertSheet().setName(PIVOT_SHEET_PREFIX + activeSheet.getName());
        const data = activeSheet.getDataRange().getValues();
        const headers = data[0];
        const rows = data.slice(1);
        const rIdColIndex = inputIdCol - 1;
        const output = [["R_ID", "Q", "Option"]];
        rows.forEach(row => {
            const r_id = row[rIdColIndex];
            for (let col = inputIdCol; col < headers.length; col++) {
                if (col === rIdColIndex)
                    continue;
                output.push([r_id, headers[col], row[col]]);
            }
        });
        pivotSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
    }
    else {
        ui.alert('User aborted request');
    }
}
