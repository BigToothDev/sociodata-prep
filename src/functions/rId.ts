const TRANSFORM_SHEET_PREFIX: string = 'sd-prep_';
const ID_HEADER: string = 'ID';

function respId(startRow: number = 2): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const targetSheetName: string = TRANSFORM_SHEET_PREFIX + activeSheet.getName();
        const transformedSheet: GoogleAppsScript.Spreadsheet.Sheet | null = spreadsheet.getSheetByName(targetSheetName);
        if (transformedSheet) return ui.alert('A transformed sheet already exists');
        const newSheet: GoogleAppsScript.Spreadsheet.Sheet = activeSheet.copyTo(spreadsheet).setName(targetSheetName);
        newSheet.insertColumnBefore(1);
        newSheet.getRange(1, 1).setValue(ID_HEADER);
        const lastRow: number = newSheet.getLastRow();
        const idsArray: number[][] = Array.from({ length: lastRow - startRow + 1 }, (_, i) => [i + 1]);
        newSheet.getRange(startRow, 1, idsArray.length, 1).setValues(idsArray).setNumberFormat('0');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}