function num_recode_wide() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const active_sheet = spreadsheet.getActiveSheet();
  if (!active_sheet) return ui.alert('No active sheet found');

  const input_all = active_sheet.getDataRange().getValues();
  const input_headers = input_all[0];
  const input_data = input_all.slice(1);

  const recoded_sheet = active_sheet.copyTo(spreadsheet).setName(`${active_sheet.getName()}_recoded`);

  const scale_sheet = spreadsheet.getSheetByName('scales');
  if (!scale_sheet) return ui.alert('No scales sheet found');

  const scale_headers = scale_sheet.getRange(1, 1, 1, scale_sheet.getLastColumn()).getValues()[0];
  const scale_cols = ['Question', 'Option', 'Code'];
  const scale_indices = scale_cols.map(col => scale_headers.indexOf(col));
  if (scale_indices.includes(-1)) return ui.alert('Missing some of input columns');

  const [q_index, opt_index, code_index] = scale_indices;
  const scale_data = scale_sheet.getRange(2, 1, scale_sheet.getLastRow() - 1, scale_sheet.getLastColumn()).getValues();

  const scale_map = {};
  for (const row of scale_data) {
    const q = row[q_index];
    const opt = row[opt_index];
    const code = row[code_index];

    if (!scale_map[q]) scale_map[q] = {};
    scale_map[q][opt] = code;
  };

  const recode_col_indices = input_headers.map((h, idx) => scale_map[h] ? idx : -1).filter(i => i !== -1);

  for (let r = 0; r < input_data.length; r++) {
    for (const c of recode_col_indices) {
      const col_name = input_headers[c];
      const cell_value = input_data[r][c];
      const code = scale_map[col_name][cell_value];
      input_data[r][c] = code !== undefined ? code : -99;
    };
  };

  recoded_sheet.getRange(2, 1, input_data.length, input_headers.length).setValues(input_data);
};