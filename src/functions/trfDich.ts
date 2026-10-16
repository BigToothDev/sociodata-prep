function trfDich(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('Scale sheet is missing');
        if (scaleSheet.getLastRow() < 2) return ui.alert('Scale sheet is empty');
        const scalesData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 3).getValues();

        const questionsSheet = spreadsheet.getSheetByName('questions');
        if (!questionsSheet) return ui.alert('Questions sheet is missing');
        if (questionsSheet.getLastRow() < 2) return ui.alert('Questions sheet is empty');

        const questionsAll = questionsSheet.getDataRange().getValues();
        const qHeaders: string[] = questionsAll[0].map(h => String(h).trim());
        const iQ = qHeaders.indexOf('Q');
        const iScale = qHeaders.indexOf('Scale');
        const iCross = qHeaders.indexOf('Cross_Options');
        const iOpt = qHeaders.indexOf('Options');

        if ([iQ, iScale, iCross, iOpt].includes(-1)) {
            return ui.alert('questions: missing Q / Scale / Cross_Options / Options column');
        }
        const questionsData = questionsAll.slice(1);

        if (activeSheet.getLastRow() < 2) return ui.alert('No data rows on the active sheet');
        const selectedCols = getSelectedColumns(activeSheet);
        const activeSheetHeaders = activeSheet
            .getRange(1, 1, 1, activeSheet.getLastColumn())
            .getValues()[0]
            .map(h => String(h).trim());
        const existingHeaders = new Set<string>(activeSheetHeaders);

        //create a map of options by set name
        const optionsBySet: Record<string, string[]> = {};
        scalesData.forEach(row => {
            const setName = String(row[0] ?? '').trim();
            const optionText = String(row[2] ?? '').trim();
            if (!setName || !optionText) return;
            (optionsBySet[setName] ??= []).push(optionText);
        });

        const byQ: Record<string, { type: string; crossValues: string[]; values: string[] }> = {};
        questionsData.forEach(row => {
            const q = String(row[iQ] ?? '').trim();
            const type = String(row[iScale] ?? '').trim();
            if (!q || (type !== 'Flags' && type !== 'Crossflag')) return;
            const values = optionsBySet[String(row[iOpt] ?? '').trim()] || [];
            const crossValues = optionsBySet[String(row[iCross] ?? '').trim()] || [];
            if (values.length === 0) return;
            if (type === 'Crossflag' && crossValues.length === 0) return;
            byQ[q] = { type, crossValues, values };
        });

        const dataRowsCount: number = activeSheet.getLastRow() - 1;
        const firstNewCol: number = activeSheet.getLastColumn() + 1;
        const newColumns: { header: string; data: string[] }[] = [];
        const badHeaders: string[] = [];

        const colToDelete: number[] = [];
        activeSheetHeaders.forEach((header, colIndex) => {
            const colNum: number = colIndex + 1;
            if (!selectedCols.has(colNum)) return;

            let found: { type: string; crossValues: string[]; values: string[] } | undefined =
                byQ[header]?.type === 'Flags' ? byQ[header] : undefined;

            if (!found) {
                const m = header.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
                if (m) {
                    const cand = byQ[m[1].trim()];
                    if (cand && cand.type === 'Crossflag') {
                        if (cand.crossValues.includes(m[2].trim())) found = cand;
                        else badHeaders.push(header);
                    }
                }
            }
            if (!found) return;
            const matchedScale = found;

            colToDelete.push(colNum);
            const colData: string[][] = activeSheet.getRange(2, colNum, dataRowsCount).getValues() as string[][];
            matchedScale.values.forEach((scaleValue: string) => {
                const newColHeader = `${header} [${scaleValue}]`;
                if (existingHeaders.has(newColHeader)) return;
                existingHeaders.add(newColHeader);
                const newColData: string[] = colData.map(row => {
                    const cell = String(row[0] ?? '');

                    const { selected, unknown } = parseFlagsCell(
                        String(row[0] ?? ''),
                        matchedScale.values
                    );

                    if (scaleValue === "Other") {
                        return unknown.length > 0 ? "TRUE" : "FALSE";
                    } else {
                        return selected.includes(scaleValue) ? "TRUE" : "FALSE";
                    }
                });
                newColumns.push({ header: newColHeader, data: newColData });
            });
        });

        if (badHeaders.length > 0) {
            ui.alert('Skipped (value in [] not found in Cross_Options):\n' + badHeaders.join('\n'));
        }

        if (colToDelete.length === 0) {
            return ui.alert('Selected columns do not contain type Flags or Crossflag');
        }

        if (newColumns.length > 0) {
            const matrix: string[][] = [];
            matrix.push(newColumns.map(col => col.header));
            for (let r = 0; r < dataRowsCount; r++) {
                matrix.push(newColumns.map(col => col.data[r]));
            }
            activeSheet
                .getRange(1, firstNewCol, matrix.length, newColumns.length)
                .setValues(matrix);
            SpreadsheetApp.flush();
        }

        const button: GoogleAppsScript.Base.Button = ui.alert(
            "Do you want to delete parent columns?",
            ui.ButtonSet.YES_NO,
        );
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