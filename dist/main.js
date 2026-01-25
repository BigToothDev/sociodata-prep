"use strict";
function onOpen() {
    let ui = SpreadsheetApp.getUi();
    ui.createMenu('SD-prep')
        .addItem('Calculate Sample', 'sampleRandom')
        .addItem('Add Response IDs', 'respId')
        .addItem('Track Dynamics', 'dynamics')
        .addSeparator()
        .addSubMenu(ui.createMenu('Transform multichoice')
        .addItem('Dichotomous', 'trfDich')
        .addItem('Categorical', 'trfCat'))
        .addSubMenu(ui.createMenu('Pivot')
        .addItem('Wide to Long', 'pivotWideToLong'))
        .addItem('Dimensions', 'dimensions')
        .addSubMenu(ui.createMenu('Recode Numerically')
        .addItem('Wide', 'numRecodeWide')
        .addItem('Long', 'numRecodeLong'))
        .addToUi();
}
