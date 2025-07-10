function check_n_past_data_dich(trf_dialogue_input_list, ui, sheet, last_column, header, last_row, values, other = false) {
    if (!trf_dialogue_input_list.length) return ui.alert('No values found to transform');
    sheet.insertColumnsAfter(last_column, trf_dialogue_input_list.length);
    for (let i = 0; i < trf_dialogue_input_list.length; i++) {
        sheet.getRange(1, last_column + 1 + i).setValue(`${header} [${trf_dialogue_input_list[i]}]`);
    };
    if (other == true) sheet.getRange(1, last_column + 1 + trf_dialogue_input_list.length).setValue(`${header} [Other]`);
    for (let col = last_column + 1; col <= last_column + trf_dialogue_input_list.length; col++) {
        let i = col - (last_column + 1);
        let columnData = [];
        for (let row = 2; row <= last_row; row++) {
            let cell = values[row - 2][0];
            columnData.push([cell.includes(trf_dialogue_input_list[i]) ? 'True' : 'False']);
        };
        sheet.getRange(2, col, columnData.length, 1).setValues(columnData);
    };
    if (other === true) {
        let otherColumnData = [];
        for (let row = 2; row <= last_row; row++) {
            let cell = values[row - 2][0];
            for (let i = 0; i < trf_dialogue_input_list.length; i++) {
                if (cell.includes(trf_dialogue_input_list[i])) cell = cell.replace(trf_dialogue_input_list[i], '');
            };
            cell = cell.replace(/[, ]+/g, '');
            otherColumnData.push([cell == '' ? 'False' : 'True']);
        };
        sheet.getRange(2, last_column + 1 + trf_dialogue_input_list.length, otherColumnData.length, 1).setValues(otherColumnData);
    };
};

function trf_dich() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const sheet = spreadsheet.getActiveSheet();
    if (!sheet) return ui.alert('No active sheet found');
    const to_trf_column = sheet.getActiveRange().getColumn();
    if (!to_trf_column) return ui.alert('No active column selected');
    let baseHeader = sheet.getRange(1, to_trf_column).getValue();
    let lastRow = sheet.getLastRow();
    let lastCol = sheet.getLastColumn();
    let vals = sheet.getRange(2, to_trf_column, lastRow - 1, 1).getValues();
    let set_option_dialogue = ui.prompt(
        "Transform Multichoice Column",
        "Paste a custom list of values to split by, or leave empty to auto-split by comma",
        ui.ButtonSet.OK_CANCEL,
    );
    let button = set_option_dialogue.getSelectedButton();
    let input_list = set_option_dialogue.getResponseText();
    if (button == ui.Button.OK) {
        if (input_list == '') {
            let sep_vals = vals.map(row => row[0]).flatMap(cell => cell.split(',')).map(str => str.trim()).filter(str => str !== '');
            let unique = [...new Set(sep_vals)];
            check_n_past_data_dich(unique, ui, sheet, lastCol, baseHeader, lastRow, vals, false);
        } else {
            let isValidSyntax = /^(\s*"[^"]*"\s*,)*\s*"[^"]*"\s*$/.test(input_list);
            if (!isValidSyntax) return ui.alert('Invalid syntax');
            let custom_user_list = input_list.match(/"[^"]*"/g).map(s => s.replace(/"/g, '').trim());
            check_n_past_data_dich(custom_user_list, ui, sheet, lastCol, baseHeader, lastRow, vals, true);
        };
    } else {
        return ui.alert('User aborted request');
    };
};