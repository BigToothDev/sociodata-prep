function w2l_pivot() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const pivot_prefix = 'pivot_';
    const active_sheet = spreadsheet.getActiveSheet();
    if (!active_sheet) return ui.alert('No active sheet found');

    const dialogue_find_id_col = ui.prompt(
        "Pivot Table",
        "Convert from wide to long format. Type the column number containing respondent IDs\nIt is recommended to use this on a sheet after running the 'Add Response IDs' function",
        ui.ButtonSet.OK_CANCEL
    );
    let input_id_col = parseInt(dialogue_find_id_col.getResponseText());
    let buttons = dialogue_find_id_col.getSelectedButton();
    if (buttons == ui.Button.OK) {
        if (!input_id_col) return ui.alert('Incorrect ID column number');
        if (spreadsheet.getSheetByName(pivot_prefix + active_sheet.getName())) return ui.alert('A pivot sheet already exists for this sheet');
        let pivot_sheet = spreadsheet.insertSheet().setName(pivot_prefix + active_sheet.getName());
        let data = active_sheet.getDataRange().getValues();
        let headers = data[0];
        let rows = data.slice(1);
        let r_idColIndex = input_id_col - 1;
        let output = [["R_ID", "Q", "Option"]];

        rows.forEach(row => {
            let r_id = row[r_idColIndex];
            for (let col = input_id_col; col < headers.length; col++) {
                if (col === r_idColIndex) continue;
                output.push([r_id, headers[col], row[col]]);
            };
        });
        pivot_sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
    } else {
        ui.alert('User aborted request');
    };
};