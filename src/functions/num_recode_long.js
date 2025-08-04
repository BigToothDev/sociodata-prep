function num_recode_long() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    const active_sheet = spreadsheet.getActiveSheet();
    if (!active_sheet) return ui.alert('No active sheet found');
    let data_headers = active_sheet.getRange(1, 1, 1, active_sheet.getLastColumn()).getValues();
    let data_cols = ['Q', 'Option'];
    let data_indices = data_cols.map(item => data_headers[0].indexOf(item));
    let data_qs = active_sheet.getRange(2, data_indices[0] + 1, active_sheet.getLastRow()).getValues();
    let data_opts = active_sheet.getRange(2, data_indices[1] + 1, active_sheet.getLastRow()).getValues();
    if (data_qs.length != data_opts.length) return ui.alert('Diff length on columns');

    const scale_sheet_name = 'scales';
    const scale_sheet = spreadsheet.getSheetByName(scale_sheet_name);
    if (!scale_sheet) return ui.alert('No scales sheet found');
    let scale_headers = scale_sheet.getRange(1, 1, 1, scale_sheet.getLastColumn()).getValues();
    let scale_cols = ['Question', 'Option', 'Code'];
    let scale_indices = scale_cols.map(item => scale_headers[0].indexOf(item));
    if (scale_indices.includes(-1)) return ui.alert('Missing some of input columns');
    let scale_qs = scale_sheet.getRange(2, scale_indices[0] + 1, active_sheet.getLastRow()).getValues();
    let scale_opts = scale_sheet.getRange(2, scale_indices[1] + 1, active_sheet.getLastRow()).getValues();
    let scale_codes = scale_sheet.getRange(2, scale_indices[2] + 1, active_sheet.getLastRow()).getValues();
    if (scale_qs.length != scale_opts.length || scale_qs.length != scale_codes.length) return ui.alert('Diff lenght on columns');

    let recoded_values = [];
    for (let i = 0; i < data_qs.length; i++) {
        let question = data_qs[i][0];
        let option = data_opts[i][0];
        let code_found = -99;

        for (let j = 0; j < scale_qs.length; j++) {
            if (scale_qs[j][0] == question && scale_opts[j][0] == option) {
                code_found = scale_codes[j][0];
                break;
            };
        };
        recoded_values.push([code_found]);
    };
    active_sheet.getRange(2, active_sheet.getLastColumn() + 1, recoded_values.length).setValues(recoded_values);
    active_sheet.getRange(1, active_sheet.getLastColumn()).setValue('Code');
};