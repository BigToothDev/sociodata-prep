function trfCat(): void | GoogleAppsScript.Base.Button {
  const context = getSheetContext();
  if (!context) return;
  const { ui, activeSheet } = context;
  const activeColumn: number = activeSheet.getActiveRange()!.getColumn();
  if (!activeColumn) return ui.alert('No active column selected');
  const regexInput: RegExp = /^([2-9]|\d{2,})\s*,(\s*"[^"]*"\s*,)*\s*"[^"]*"\s*$/;
  const lastRow: number = activeSheet.getLastRow();
  const lastCol: number = activeSheet.getLastColumn();
  const vals: string[][] = activeSheet.getRange(2, activeColumn, lastRow - 1, 1).getValues();
  const header: string = activeSheet.getRange(1, activeColumn).getValue();
  if (lastRow <= 2) return ui.alert('No data to process (need at least 3 rows)');
  const dialogue: GoogleAppsScript.Base.PromptResponse = ui.prompt(
    "Transform Multichoice Column",
    `Enter the number of options and the list in the format:\n3, "Option A", "Option B", "Option C"`,
    ui.ButtonSet.OK_CANCEL
  );
  const buttons: GoogleAppsScript.Base.Button = dialogue.getSelectedButton();
  const input: string = dialogue.getResponseText();
  if (buttons == ui.Button.OK) {
    if (!regexInput.test(input)) return ui.alert('Invalid syntax');
    const variantsNum: number = parseInt(input.match(/^([2-9]|\d{2,})/)![0]);
    if (variantsNum < 2 || variantsNum > 10) return ui.alert('Number of variants must be between 2 and 10');
    const optionsVocabulary: string[] = input.match(/"[^"]*"/g)!.map(s => s.replace(/"/g, '').trim());
    if (variantsNum > optionsVocabulary.length) return ui.alert('The number of columns is greater than the number of options');
    function escapeRegex(str: any) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const pattern = new RegExp(optionsVocabulary.map(escapeRegex).join('|'), 'g');
    for (let col = lastCol + 1; col <= lastCol + variantsNum; col++) {
      const columnData: string[][] = [];
      const i = col - (lastCol + 1);
      for (let row = 2; row <= lastRow; row++) {
        const original_cell = vals[row - 2][0];
        if (typeof original_cell === 'string') {
          const matches = original_cell.match(pattern) || [];
          const value = i < matches.length ? matches[i] : '-1';
          columnData.push([value]);
        } else {
          columnData.push(['-99']);
        }
      }
      activeSheet.getRange(1, col).setValue(`R_Option ${i + 1}: ${header}`);
      activeSheet.getRange(2, col, columnData.length, 1).setValues(columnData);
    }
  } else {
    return ui.alert('User aborted request');
  }
}