function numRecodeWide(): void | GoogleAppsScript.Base.Button {
  const context = getSheetContext();
  if (!context) return;
  const { spreadsheet, ui, activeSheet } = context;
  try {
    const recodedName = `${activeSheet.getName()}_recoded`;
    const existingRecoded = spreadsheet.getSheetByName(recodedName);
    if (existingRecoded) {
      const answer = ui.alert(
        `Sheet "${recodedName}" already exists. Overwrite it?`,
        ui.ButtonSet.YES_NO,
      );
      if (answer !== ui.Button.YES) return ui.alert('Recoding cancelled, existing sheet retained');
    }

    const inputAll: string[][] = activeSheet.getDataRange().getValues();
    const inputHeaders: string[] = inputAll[0];
    const inputData: any[][] = inputAll.slice(1);
    const scaleSheet: GoogleAppsScript.Spreadsheet.Sheet | null = spreadsheet.getSheetByName('scales');
    if (!scaleSheet) return ui.alert('No scales sheet found');

    const questionsSheet = spreadsheet.getSheetByName('questions');
    if (!questionsSheet) return ui.alert('No questions sheet found');

    const questionsAll = questionsSheet.getDataRange().getValues();
    const qHeaders: string[] = questionsAll[0].map(h => String(h).trim());
    const iQ = qHeaders.indexOf('Q');
    const iScale = qHeaders.indexOf('Scale');
    const iCross = qHeaders.indexOf('Cross_Options');
    const iOpt = qHeaders.indexOf('Options');

    if ([iQ, iScale, iCross, iOpt].includes(-1)) {
      return ui.alert('questions: missing one of Q / Scale / Cross_Options / Options columns');
    }
    const questionsData = questionsAll.slice(1);

    const scaleData = scaleSheet
      .getRange(2, 1, scaleSheet.getLastRow() - 1, 3)
      .getValues();

    const codesBySet: Record<string, Record<string, number>> = {};
    for (const row of scaleData) {
      const setName = String(row[0]).trim();
      const opt = String(row[2]).trim();
      if (!setName || !opt) continue;
      if (!codesBySet[setName]) codesBySet[setName] = {};
      codesBySet[setName][opt] = Number(row[1]);
    }

    const byQ: Record<string, { type: string; crossSet: string; optSet: string }> = {};
    for (const row of questionsData) {
      const q = String(row[iQ]).trim();
      if (!q) continue;
      byQ[q] = {
        type: String(row[iScale]).trim(),
        crossSet: String(row[iCross]).trim(),
        optSet: String(row[iOpt]).trim(),
      };
    }

    const codesByCol: Record<number, Record<string, number>> = {};
    const badHeaders: string[] = [];
    const binaryCols = new Set<number>();

    inputHeaders.forEach((h, idx) => {
      const header = String(h).trim();

      const direct = byQ[header];
      if (direct) {
        if (direct.type === 'Variants' && codesBySet[direct.optSet]) {
          codesByCol[idx] = codesBySet[direct.optSet];
        }
        return;
      }

      const m = header.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
      if (!m) return;
      const base = m[1].trim();
      const tag = m[2].trim();
      const def = byQ[base];

      if (def) {
        if (def.type === 'Crosstab') {
          const crossCodes = codesBySet[def.crossSet];
          if (!crossCodes || !(tag in crossCodes)) {
            badHeaders.push(header);
            return;
          }
          if (codesBySet[def.optSet]) codesByCol[idx] = codesBySet[def.optSet];
          return;
        }
        if (def.type === 'Flags') {
          if (codesBySet[def.optSet] && tag in codesBySet[def.optSet]) binaryCols.add(idx);
          return;
        }
        return;
      }

      const m2 = base.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
      if (!m2) return;
      const def2 = byQ[m2[1].trim()];
      if (!def2 || def2.type !== 'Crossflag') return;
      const rowTag = m2[2].trim();
      if (codesBySet[def2.crossSet] && rowTag in codesBySet[def2.crossSet]
          && codesBySet[def2.optSet] && tag in codesBySet[def2.optSet]) {
        binaryCols.add(idx);
      }
    });

    const recode_col_indices = Object.keys(codesByCol).map(Number);

    for (let r = 0; r < inputData.length; r++) {
      for (const c of recode_col_indices) {
        const cell_value = String(inputData[r][c]).trim();
        const code = codesByCol[c][cell_value];
        inputData[r][c] = code !== undefined ? code : -99;
      }
      binaryCols.forEach(c => {
        const v = String(inputData[r][c]).trim().toUpperCase();
        inputData[r][c] = v === 'TRUE' ? TRUE_CODE : v === 'FALSE' ? FALSE_CODE : -99;
      });
    }

    if (existingRecoded) spreadsheet.deleteSheet(existingRecoded);
    const recodedSheet: GoogleAppsScript.Spreadsheet.Sheet = activeSheet.copyTo(spreadsheet).setName(recodedName);
    recodedSheet.getRange(2, 1, inputData.length, inputHeaders.length).setValues(inputData);

    if (badHeaders.length > 0) {
      ui.alert('Not recoded (value in [] not found in Cross_Options):\n' + badHeaders.join('\n'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.alert('Error occurred: ' + message);
  }
}