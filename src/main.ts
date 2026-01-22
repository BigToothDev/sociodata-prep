function onOpen(): void {
    let ui: GoogleAppsScript.Base.Ui = SpreadsheetApp.getUi();
    ui.createMenu('SD-prep')
        .addItem('Calculate Sample', 'sampleRandom')
        .addItem('Add Response IDs', 'respId')
        .addItem('Track Dynamics', 'dynam')
        .addSeparator()
        .addSubMenu(
            ui.createMenu('Transform multichoice')
                .addItem('Dichotomous', 'trfDich')
                .addItem('Categorical', 'trfCat')
        )
        .addSubMenu(
            ui.createMenu('Pivot')
                .addItem('Wide to Long', 'w2lPivot')
        )
        .addItem('Dimensions', 'dimensions')
        .addSubMenu(
            ui.createMenu('Recode Numerically')
                .addItem('Wide', 'numRecodeWide')
                .addItem('Long', 'numRecodeLong')
        )
        .addToUi();
}