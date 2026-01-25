"use strict";
function getSheetContext() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const activeSheet = spreadsheet.getActiveSheet();
    if (!activeSheet) {
        ui.alert('No active sheet found');
        return null;
    }
    return { spreadsheet, ui, activeSheet };
}
