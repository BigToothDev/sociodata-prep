function trfDich(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const catalogResult = loadMultiChoiceCatalog(spreadsheet);
        if (!catalogResult.catalog) return ui.alert(catalogResult.error ?? 'Unable to load questionnaire metadata');
        const catalog = catalogResult.catalog;

        if (activeSheet.getLastRow() < 2) return ui.alert('No data rows on the active sheet');
        const selectedCols = getSelectedColumns(activeSheet);
        const activeSheetHeaders = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
        const existingHeaders = new Set<string>(activeSheetHeaders);

        const dataRowsCount: number = activeSheet.getLastRow() - 1;
        const firstNewCol: number = activeSheet.getLastColumn() + 1;
        const newColumns: { header: string; data: string[] }[] = [];
        const badHeaders: string[] = [];

        const colToDelete: number[] = [];
        activeSheetHeaders.forEach((header, colIndex) => {
            const colNum: number = colIndex + 1;
            if (!selectedCols.has(colNum)) return;

            const resolved = resolveMultiChoiceHeader(header, catalog);
            if (resolved === 'invalid-cross-value') {
                badHeaders.push(header);
                return;
            }
            if (!resolved) return;
            const matchedScale = resolved.definition;

            colToDelete.push(colNum);
            const colData = activeSheet.getRange(2, colNum, dataRowsCount).getValues();
            const parsedRows = colData.map(row => parseFlagsCell(String(row[0] ?? ''), matchedScale.values));
            matchedScale.values.forEach((scaleValue: string) => {
                const newColHeader = `${header} [${scaleValue}]`;
                if (existingHeaders.has(newColHeader)) return;
                existingHeaders.add(newColHeader);
                const newColData: string[] = parsedRows.map(({ selected, unknown }) => {
                    if (scaleValue === "Other") {
                        return unknown.length > 0 ? "TRUE" : "FALSE";
                    } else {
                        return selected.includes(scaleValue) ? "TRUE" : "FALSE";
                    }
                });
                newColumns.push({ header: newColHeader, data: newColData });
            });
        });

        if (badHeaders.length > 0) ui.alert('Skipped (value in [] not found in Cross_Options):\n' + badHeaders.join('\n'));

        if (colToDelete.length === 0) return ui.alert('Selected columns do not contain type Flags or Crossflag');

        if (newColumns.length > 0) {
            const matrix: string[][] = [];
            matrix.push(newColumns.map(col => col.header));
            for (let r = 0; r < dataRowsCount; r++) {
                matrix.push(newColumns.map(col => col.data[r]));
            }
            activeSheet.getRange(1, firstNewCol, matrix.length, newColumns.length).setValues(matrix);
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