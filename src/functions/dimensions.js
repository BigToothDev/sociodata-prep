function dimensions() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const active_sheet = spreadsheet.getActiveSheet();
    if (!active_sheet) return ui.alert('No active sheet found');

    let headers = active_sheet.getRange(1, 1, 1, active_sheet.getLastColumn()).getValues();
    let q = headers[0].indexOf('Q');
    let q_index = q + 1;
    let data_to_dim = active_sheet.getRange(2, q_index, active_sheet.getLastRow() - 1, 1).getValues();
    let first_dimension = [];
    let second_dimension = [];
    let Q_short = [];

    for (let i = 0; i < data_to_dim.length; i++) {
        let value = data_to_dim[i][0];

        if (!value || value == '') {
            first_dimension.push('');
            second_dimension.push('');
            Q_short.push('');
        } else {
            let sq_br_matches = value.match(/\[[^\]]*\]/g) || [];
            first_dimension.push(sq_br_matches[0] ? sq_br_matches[0].slice(1, -1) : '');
            second_dimension.push(sq_br_matches[1] ? sq_br_matches[1].slice(1, -1) : '');
            Q_short.push(String(value).replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim());
        };
    };
    active_sheet.getRange(1, active_sheet.getLastColumn() + 1, 1, 3).setValues([['first_dimension', 'second_dimension', 'Q_short']]);
    active_sheet.getRange(2, active_sheet.getLastColumn() - 2, first_dimension.length, 1).setValues(first_dimension.map(v => [v]));
    active_sheet.getRange(2, active_sheet.getLastColumn() - 1, second_dimension.length, 1).setValues(second_dimension.map(v => [v]));
    active_sheet.getRange(2, active_sheet.getLastColumn(), Q_short.length, 1).setValues(Q_short.map(v => [v]));
};