function trf_cat() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const active_sheet = spreadsheet.getActiveSheet();
  if (!active_sheet) return ui.alert('No active sheet found');
  const active_column = active_sheet.getActiveRange().getColumn();
  if (!active_column) return ui.alert('No active column selected');
  const regex_input = /^([2-9]|\d{2,})\s*,(\s*"[^"]*"\s*,)*\s*"[^"]*"\s*$/;
  let lastRow = active_sheet.getLastRow();
  let lastCol = active_sheet.getLastColumn();
  let vals = active_sheet.getRange(2, active_column, lastRow - 1, 1).getValues();
  let header = active_sheet.getRange(1, active_column).getValue();
  if (lastRow <= 2) return ui.alert('No data to process (need at least 3 rows)');

  let dialogue = ui.prompt(
    "Transform Multichoice Column",
    `Enter the number of options and the list in the format:\n3, "Option A", "Option B", "Option C"`,
    ui.ButtonSet.OK_CANCEL
  );
  let buttons = dialogue.getSelectedButton();
  let string_input = dialogue.getResponseText();
  if (buttons == ui.Button.OK) {
    if (!regex_input.test(string_input)) return ui.alert('Invalid syntax');
    let variants_num = parseInt(string_input.match(/^([2-9]|\d{2,})/)[0]);
    if (variants_num < 2 || variants_num > 10) return ui.alert('Number of variants must be between 2 and 10');
    let options_vocab = string_input.match(/"[^"]*"/g).map(s => s.replace(/"/g, '').trim());
    if (variants_num > options_vocab.length) return ui.alert('The number of columns is greater than the number of options');
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    const pattern = new RegExp(options_vocab.map(escapeRegex).join('|'), 'g');
    for (let col = lastCol + 1; col <= lastCol + variants_num; col++) {
      let columnData = [];
      let i = col - (lastCol + 1);
      for (let row = 2; row <= lastRow; row++) {
        let original_cell = vals[row - 2][0];
        if (typeof original_cell === 'string') {
          let matches = original_cell.match(pattern) || [];
          let value = i < matches.length ? matches[i] : '-1';
          columnData.push([value]);
        } else {
          columnData.push(['-1']);
        };
      };
      active_sheet.getRange(1, col).setValue(`R_Option ${i+1}: ${header}`);
      active_sheet.getRange(2, col, columnData.length, 1).setValues(columnData);
    };
  } else {
    return ui.alert('User aborted request');
  };
};