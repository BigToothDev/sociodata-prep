"use strict";
const TRANSFORM_SHEET_PREFIX = 'sd-prep_';
const ID_HEADER = 'R_ID';
function respId(startRow = 2) {
    const context = getSheetContext();
    if (!context)
        return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const targetSheetName = TRANSFORM_SHEET_PREFIX + activeSheet.getName();
        const transformedSheet = spreadsheet.getSheetByName(targetSheetName);
        if (transformedSheet)
            return ui.alert('A transformed sheet already exists');
        const newSheet = activeSheet.copyTo(spreadsheet).setName(targetSheetName);
        newSheet.insertColumnBefore(1);
        newSheet.getRange(1, 1).setValue(ID_HEADER);
        const lastRow = newSheet.getLastRow();
        const idsArray = Array.from({ length: lastRow - startRow + 1 }, (_, i) => [i + 1]);
        newSheet.getRange(startRow, 1, idsArray.length, 1).setValues(idsArray).setNumberFormat('0');
        newSheet.autoResizeColumns(1, 1);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}
