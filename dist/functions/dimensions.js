"use strict";
function dimensions() {
    const context = getSheetContext();
    if (!context)
        return;
    const { ui, activeSheet } = context;
    try {
        const headers = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues();
        const q = headers[0].indexOf('Q');
        const qIndex = q + 1;
        const dataToDimension = activeSheet.getRange(2, qIndex, activeSheet.getLastRow() - 1, 1).getValues();
        const firstDimension = [];
        const secondDimension = [];
        const qShort = [];
        for (let i = 0; i < dataToDimension.length; i++) {
            let value = dataToDimension[i][0];
            if (!value || value == '') {
                firstDimension.push('');
                secondDimension.push('');
                qShort.push('');
            }
            else {
                const squareBracketsMatch = value.match(/\[[^\]]*\]/g);
                firstDimension.push(squareBracketsMatch && squareBracketsMatch[0] ? squareBracketsMatch[0].slice(1, -1) : '');
                secondDimension.push(squareBracketsMatch && squareBracketsMatch[1] ? squareBracketsMatch[1].slice(1, -1) : '');
                qShort.push(String(value).replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim());
            }
        }
        activeSheet.getRange(1, activeSheet.getLastColumn() + 1, 1, 3).setValues([['first_dimension', 'second_dimension', 'q_short']]);
        activeSheet.getRange(2, activeSheet.getLastColumn() - 2, firstDimension.length, 1).setValues(firstDimension.map(v => [v]));
        activeSheet.getRange(2, activeSheet.getLastColumn() - 1, secondDimension.length, 1).setValues(secondDimension.map(v => [v]));
        activeSheet.getRange(2, activeSheet.getLastColumn(), qShort.length, 1).setValues(qShort.map(v => [v]));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}
