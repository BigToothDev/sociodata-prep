function trf_dich() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const sheet = spreadsheet.getActiveSheet();
    if (!sheet) return ui.alert('No active sheet found');
    const to_trf_column = sheet.getActiveRange().getColumn();
    if (!to_trf_column) return ui.alert('No active column selected');
    let set_option_dialogue = ui.prompt(
        "Transform Multichoice Column",
        "Paste a custom list of values to split by, or leave empty to auto-split by comma",
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
            if (!unique.length) return ui.alert('No values found to transform');
            sheet.insertColumnsAfter(lastCol, unique.length);

            let baseHeader = sheet.getRange(1, to_trf_column).getValue();
            for (let i = 0; i < unique.length; i++) {
                sheet.getRange(1, lastCol + 1 + i).setValue(`${baseHeader} [${unique[i]}]`);
            };
            for (let col = lastCol + 1; col <= lastCol + unique.length; col++) {
                let i = col - (lastCol + 1);
                let columnData = [];
                for (let row = 2; row <= lastRow; row++) {
                    let cell = vals[row-2][0];
                    let processed_cell_list = cell.split(',').map(str => str.trim()).filter(str => str !== '');
                    columnData.push([processed_cell_list.includes(unique[i]) ? 'True' : 'False']);
                };
                sheet.getRange(2, col, columnData.length, 1).setValues(columnData);
            };
        } else {
            return ui.alert('Custom split is not yet supported')
        };
    } else {
        return ui.alert('User aborted request');
    };
};