const transform_sheet_prefix = 'sd-prep_';
const id = 'ID';

function resp_id(start_row = 2) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    let active_sheet = spreadsheet.getActiveSheet();
    let to_create_sheet = spreadsheet.getSheetByName(transform_sheet_prefix + active_sheet.getName());
    if (!active_sheet) {
        return ui.alert('No active sheet found');
    } else {
        if (!to_create_sheet) {
            let new_sheet = active_sheet.copyTo(spreadsheet).setName(transform_sheet_prefix + active_sheet.getName());
            new_sheet.insertColumnBefore(1);
            new_sheet.getRange(1, 1).setValue(id);
            let last_row = new_sheet.getLastRow();
            for (let i = start_row; i <= last_row; i++) {
                new_sheet.getRange(i, 1).setValue(i - 1).setNumberFormat('0');
            };
        } else {
            return ui.alert('A transformed sheet already exists');
        };
    };
};