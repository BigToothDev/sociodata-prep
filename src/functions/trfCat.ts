function trfCat(): void | GoogleAppsScript.Base.Button {
  const context = getSheetContext();
  if (!context) return;
  const { spreadsheet, ui, activeSheet } = context;
  try {
    const catalogResult = loadMultiChoiceCatalog(spreadsheet);
    if (!catalogResult.catalog) return ui.alert(catalogResult.error ?? 'Unable to load questionnaire metadata');
    const catalog = catalogResult.catalog;

    if (activeSheet.getLastRow() < 2) return ui.alert('No data rows on the active sheet');
    const selectedCols = getSelectedColumns(activeSheet);
    const activeSheetHeaders = activeSheet
      .getRange(1, 1, 1, activeSheet.getLastColumn())
      .getValues()[0]
      .map(h => String(h).trim());
    const existingHeaders = new Set<string>(activeSheetHeaders);

    const dataRowsCount: number = activeSheet.getLastRow() - 1;
    const firstNewCol: number = activeSheet.getLastColumn() + 1;
    const badHeaders: string[] = [];
    const emptyCols: string[] = [];

    const pending: { header: string; colNum: number; parsed: (string | number)[][]; maxSlots: number }[] = [];

    activeSheetHeaders.forEach((header, colIndex) => {
      const colNum: number = colIndex + 1;
      if (!selectedCols.has(colNum)) return;

      const resolved = resolveMultiChoiceHeader(header, catalog);
      if (resolved === 'invalid-cross-value') {
        badHeaders.push(header);
        return;
      }
      if (!resolved) return;
      const def = resolved.definition;

      const colData = activeSheet.getRange(2, colNum, dataRowsCount).getValues();
      const marker: string | number = def.values.includes('Other') ? 'Other' : -99;

      const parsed: (string | number)[][] = colData.map(row => {
        const text = String(row[0] ?? '').trim();
        if (!text) return [];
        const { selected, unknown } = parseFlagsCell(String(row[0] ?? ''), def.values);
        const slots: (string | number)[] = [...selected];
        if (unknown.length > 0) slots.push(marker);
        return slots;
      });

      const maxSlots = Math.max(0, ...parsed.map(s => s.length));
      if (maxSlots === 0) {
        emptyCols.push(header);
        return;
      }
      pending.push({ header, colNum, parsed, maxSlots });
    });

    if (badHeaders.length > 0) {
      ui.alert('Skipped (value in [] not found in Cross_Options):\n' + badHeaders.join('\n'));
    }
    if (emptyCols.length > 0) {
      ui.alert('Skipped (no answers in data):\n' + emptyCols.join('\n'));
    }
    if (pending.length === 0) {
      return ui.alert('Selected columns do not contain type Flags or Crossflag with answers');
    }

    const maxesText = pending.map(p => `${p.header} = ${p.maxSlots}`).join('\n');
    const dialogue = ui.prompt(
      'Number of option columns',
      `Max selected in data:\n${maxesText}\n\nEnter the number of columns (first N answers are kept, the rest are cut off).\nLeave empty for auto (max of each column).`,
      ui.ButtonSet.OK_CANCEL,
    );
    if (dialogue.getSelectedButton() !== ui.Button.OK) return ui.alert('User aborted request');

    const rawInput = dialogue.getResponseText().trim();
    let limit: number | null = null;
    if (rawInput !== '') {
      if (!/^\d+$/.test(rawInput) || parseInt(rawInput, 10) < 1) {
        return ui.alert('Invalid number: enter a whole number of 1 or more, or leave empty for auto');
      }
      limit = parseInt(rawInput, 10);
    }

    const newColumns: { header: string; data: (string | number)[] }[] = [];
    const colToDelete: number[] = [];
    const truncatedInfo: string[] = [];

    pending.forEach(p => {
      const slotsCount = limit ?? p.maxSlots;

      const cutRows = p.parsed.filter(s => s.length > slotsCount).length;
      if (cutRows > 0) truncatedInfo.push(`${p.header}: ${cutRows}`);

      for (let i = 0; i < slotsCount; i++) {
        const newColHeader = `R_Option ${i + 1}: ${p.header}`;
        if (existingHeaders.has(newColHeader)) continue;
        existingHeaders.add(newColHeader);
        newColumns.push({ header: newColHeader, data: p.parsed.map(s => (i < s.length ? s[i] : '')) });
      }
      if (slotsCount > 0) colToDelete.push(p.colNum);
    });

    if (newColumns.length > 0) {
      const matrix: (string | number)[][] = [newColumns.map(col => col.header)];
      for (let r = 0; r < dataRowsCount; r++) {
        matrix.push(newColumns.map(col => col.data[r]));
      }
      activeSheet.getRange(1, firstNewCol, matrix.length, newColumns.length).setValues(matrix);
      SpreadsheetApp.flush();
    }

    if (truncatedInfo.length > 0) {
      ui.alert(`Respondents with more answers than ${limit}; extra answers were cut off:\n` + truncatedInfo.join('\n'));
    }

    const button = ui.alert('Do you want to delete parent columns?', ui.ButtonSet.YES_NO);
    if (button == ui.Button.YES) {
      colToDelete.sort((a, b) => a - b);
      for (let i = 0; i < colToDelete.length; i++) {
        activeSheet.deleteColumn(colToDelete[i] - i);
      }
    } else {
      return ui.alert('Parent columns retained');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.alert('Error occurred: ' + message);
  }
}