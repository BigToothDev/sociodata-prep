// Committed as an example of what not to do — runtime matters
function trf_dich() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const sheet = spreadsheet.getActiveSheet();
    if (!sheet) return ui.alert('No active sheet found');
    const to_trf_column = sheet.getActiveRange().getColumn();
    if (!to_trf_column) return ui.alert('No active column found');
    let set_option_dialogue = ui.prompt(
        "Transform multichoice data column",
        "Paste pattern of codes to select of leave empty for aoutomated split by comma",
        ui.ButtonSet.OK_CANCEL,
    );
    let button = set_option_dialogue.getSelectedButton();
    let input_list = set_option_dialogue.getResponseText();
    if (button == ui.Button.OK) {
        if (input_list == '') {
            let lastRow = sheet.getLastRow();
            let lastCol = sheet.getLastColumn();
            let vals = sheet.getRange(2, to_trf_column, lastRow - 1, 1).getValues();
            let sep_vals = vals.map(row => row[0]).flatMap(cell => cell.split(',')).map(str => str.trim()).filter(str => str !== '');
            let unique = [...new Set(sep_vals)];
            if (!unique.length) return ui.alert('No elements');
            sheet.insertColumnsAfter(lastCol, unique.length);
            for (let col = lastCol + 1; col <= lastCol + unique.length; col++) {
                let i = col - (lastCol + 1);
                sheet.getRange(1, col).setValue(sheet.getRange(1, to_trf_column).getValue() + ` [${unique[i]}]`);
                for (let row = 2; row <= lastRow; row++) {
                    let to_process_cell = sheet.getRange(row, to_trf_column).getValue();
                    let processed_cell_list = to_process_cell.split(',').map(str => str.trim()).filter(str => str !== '');
                    if (processed_cell_list.includes(unique[i])) {
                        sheet.getRange(row, col).setValue('True');
                    } else {
                        sheet.getRange(row, col).setValue('False');
                    };
                };
            };
        } else {
            return ui.alert('Custom split is in plan to be made!')
        };
    } else {
        return ui.alert('User aborted request');
    };
};