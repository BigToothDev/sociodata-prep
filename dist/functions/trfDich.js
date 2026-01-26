"use strict";
function trfDich() {
    const context = getSheetContext();
    if (!context)
        return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet)
            return ui.alert('Scale sheet is missing');
        const activeSheetHeaders = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues();
        const scalesHeadersAndValues = scaleSheet.getRange(1, 1, scaleSheet.getLastRow(), scaleSheet.getLastColumn() - 1).getValues();
        const onlyMultichoiceQs = scalesHeadersAndValues.filter(row => row[1] === 'TRUE' || row[1] === true).map(row => String(row[0]));
        const questionScaleMap = onlyMultichoiceQs.map(qStr => {
            const match = qStr.match(/^(.*?)(\[[^\]]*\])\s*$/);
            if (match) {
                return { q: match[1].trim(), value: match[2].replace(/[\[\]]/g, '').trim() };
            }
            else {
                return { q: qStr.trim(), value: '' };
            }
        });
        const mergedMap = [];
        const tempMap = {};
        questionScaleMap.forEach(item => {
            if (!item.q)
                return;
            if (!tempMap[item.q])
                tempMap[item.q] = [];
            if (item.value && !tempMap[item.q].includes(item.value))
                tempMap[item.q].push(item.value);
        });
        for (const [q, values] of Object.entries(tempMap)) {
            mergedMap.push({ q, values });
        }
        const colToDelete = [];
        activeSheetHeaders[0].forEach((header, colIndex) => {
            const matchedScale = mergedMap.find(item => item.q === header);
            if (matchedScale) {
                const colNum = colIndex + 1;
                colToDelete.push(colNum);
                const colData = activeSheet.getRange(2, colNum, activeSheet.getLastRow() - 1).getValues();
                matchedScale.values.forEach((scaleValue) => {
                    const newColIndex = activeSheet.getLastColumn() + 1;
                    const newColHeader = `${header} [${scaleValue}]`;
                    const newColData = colData.map(row => {
                        const cell = String(row[0] || '');
                        if (scaleValue === "Other") {
                            const cleanedCell = matchedScale.values.reduce((str, val) => {
                                const escapedVal = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                return str.replace(new RegExp(escapedVal, 'g'), '');
                            }, cell).replace(/[.,;:!?]/g, '').trim();
                            return [cleanedCell ? "TRUE" : "FALSE"];
                        }
                        else {
                            return [cell.includes(scaleValue) ? "TRUE" : "FALSE"];
                        }
                    });
                    activeSheet.getRange(1, newColIndex).setValue(newColHeader);
                    activeSheet.getRange(2, newColIndex, newColData.length, 1).setValues(newColData);
                });
            }
        });
        const button = ui.alert("Do you want to delete parent columns?", ui.ButtonSet.YES_NO);
        if (button == ui.Button.YES) {
            for (let i = 0; i < colToDelete.length; i++) {
                activeSheet.deleteColumn(colToDelete[i] - i);
            }
        }
        else {
            return ui.alert('Parent columns retained');
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}
