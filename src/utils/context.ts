interface SheetContext {
    spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
    ui: GoogleAppsScript.Base.Ui;
    activeSheet: GoogleAppsScript.Spreadsheet.Sheet;
}

function getSheetContext(): SheetContext | null {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const activeSheet = spreadsheet.getActiveSheet();
    if (!activeSheet) {
        ui.alert('No active sheet found');
        return null;
    }
    return { spreadsheet, ui, activeSheet };
}