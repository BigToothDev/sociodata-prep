function trfDich(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('Scale sheet is missing');
        const activeSheetHeaders = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues() as string[][];
        const scalesHeadersAndValues: (string | boolean)[][] = scaleSheet.getRange(1, 1, scaleSheet.getLastRow(), scaleSheet.getLastColumn() - 1).getValues();
        const onlyMultichoiceQs: string[] = scalesHeadersAndValues.filter(row => row[1] === 'TRUE' || row[1] === true).map(row => String(row[0]));
        const questionScaleMap: { q: string; value: string }[] = onlyMultichoiceQs.map(qStr => {
            const match: RegExpMatchArray | null = qStr.match(/^(.*?)(\[[^\]]*\])\s*$/);
            if (match) {
                return { q: match[1].trim(), value: match[2].replace(/[\[\]]/g, '').trim() };
            } else {
                return { q: qStr.trim(), value: '' };
            }
        });
        const mergedMap: { q: string; values: string[] }[] = [];
        const tempMap: Record<string, string[]> = {};
        questionScaleMap.forEach(item => {
            if (!item.q) return;
            if (!tempMap[item.q]) tempMap[item.q] = [];
            if (item.value && !tempMap[item.q].includes(item.value)) tempMap[item.q].push(item.value);
        });
        for (const [q, values] of Object.entries(tempMap)) {
            mergedMap.push({ q, values });
        }
        const colToDelete: number[] = [];
        activeSheetHeaders[0].forEach((header, colIndex) => {
            const matchedScale: { q: string; values: string[] } | undefined = mergedMap.find(item => item.q === header);
            if (matchedScale) {
                const colNum: number = colIndex + 1;
                colToDelete.push(colNum);
                const colData: string[][] = activeSheet.getRange(2, colNum, activeSheet.getLastRow() - 1).getValues() as string[][];
                matchedScale.values.forEach((scaleValue: string) => {
                    const newColIndex: number = activeSheet.getLastColumn() + 1;
                    const newColHeader = `${header} [${scaleValue}]`;
                    const newColData: string[][] = colData.map(row => {
                        const cell = String(row[0] || '');
                        if (scaleValue === "Other") {
                            const cleanedCell = matchedScale.values.reduce((str: string, val: string) => {
                                const escapedVal: string = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                return str.replace(new RegExp(escapedVal, 'g'), '');
                            }, cell).replace(/[.,;:!?]/g, '').trim();
                            return [cleanedCell ? "TRUE" : "FALSE"];
                        } else {
                            return [cell.includes(scaleValue) ? "TRUE" : "FALSE"];
                        }
                    });
                    activeSheet.getRange(1, newColIndex).setValue(newColHeader);
                    activeSheet.getRange(2, newColIndex, newColData.length, 1).setValues(newColData);
                });
            }
        });
        const button: GoogleAppsScript.Base.Button = ui.alert(
            "Do you want to delete parent columns?",
            ui.ButtonSet.YES_NO,
        );
        if (button == ui.Button.YES) {
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