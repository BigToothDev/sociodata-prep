"use strict";
function pasteDataDich(_activeSheet, _ui, _inputList, _baseHeader, _lastRow, _values, _other = false) {
    if (!_inputList.length)
        return _ui.alert('No values passed to transform');
    const lastColumn = _activeSheet.getLastColumn();
    const totalNewCols = _inputList.length + (_other ? 1 : 0);
    _activeSheet.insertColumnsAfter(lastColumn, totalNewCols);
    for (let i = 0; i < _inputList.length; i++) {
        _activeSheet.getRange(1, lastColumn + 1 + i).setValue(`${_baseHeader} [${_inputList[i]}]`);
    }
    for (let col = lastColumn + 1; col <= lastColumn + _inputList.length; col++) {
        const i = col - (lastColumn + 1);
        const columnData = [];
        for (let row = 2; row <= _lastRow; row++) {
            const rawCell = _values[row - 2][0];
            const cell = typeof rawCell === "string" ? rawCell : String(rawCell !== null && rawCell !== void 0 ? rawCell : "");
            columnData.push([cell.includes(_inputList[i]) ? 'True' : 'False']);
        }
        _activeSheet.getRange(2, col, columnData.length, 1).setValues(columnData);
    }
    if (_other === true) {
        const otherColIndex = lastColumn + 1 + _inputList.length;
        _activeSheet.getRange(1, otherColIndex).setValue(`${_baseHeader} [Other]`);
        const otherColumnData = [];
        for (let row = 2; row <= _lastRow; row++) {
            const rawCell = _values[row - 2][0];
            let cell = typeof rawCell === "string" ? rawCell : String(rawCell !== null && rawCell !== void 0 ? rawCell : "");
            for (let i = 0; i < _inputList.length; i++) {
                cell = cell.replace(_inputList[i], '');
            }
            cell = cell.replace(/[, ]+/g, '');
            otherColumnData.push([cell === '' ? 'False' : 'True']);
        }
        _activeSheet.getRange(2, otherColIndex, otherColumnData.length, 1).setValues(otherColumnData);
    }
}
function trfDich() {
    const context = getSheetContext();
    if (!context)
        return;
    const { ui, activeSheet } = context;
    const userActiveRange = activeSheet.getActiveRange();
    if (!userActiveRange)
        return ui.alert('No active range selected');
    const toTrfColumn = activeSheet.getActiveRange().getColumn();
    const baseHeader = activeSheet.getRange(1, toTrfColumn).getValue();
    const lastRow = activeSheet.getLastRow();
    const vals = activeSheet.getRange(2, toTrfColumn, lastRow - 1, 1).getValues();
    const set_option_dialogue = ui.prompt("Transform Multichoice Column", "Paste a custom list of values to split by, or leave empty to auto-split by comma", ui.ButtonSet.OK_CANCEL);
    const button = set_option_dialogue.getSelectedButton();
    const inputList = set_option_dialogue.getResponseText();
    if (button == ui.Button.OK) {
        if (inputList === '' || inputList === null) {
            const sep_vals = vals.map(row => row[0]).flatMap(cell => cell.split(',')).map(str => str.trim()).filter(str => str !== '');
            const unique = [...new Set(sep_vals)];
            pasteDataDich(activeSheet, ui, unique, baseHeader, lastRow, vals, false);
        }
        else {
            let isValidSyntax = /^(\s*"[^"]*"\s*,)*\s*"[^"]*"\s*$/.test(inputList);
            if (!isValidSyntax)
                return ui.alert('Invalid syntax');
            const customUserList = inputList.match(/"[^"]*"/g).map(s => s.replace(/"/g, '').trim());
            pasteDataDich(activeSheet, ui, customUserList, baseHeader, lastRow, vals, true);
        }
    }
    else {
        return ui.alert('User aborted request');
    }
}
