function onOpen() {
    let ui = SpreadsheetApp.getUi();
    ui.createMenu('SD-prep')
        .addItem('Calculate Sample', 'sample_rand')
        .addItem('Add Response IDs', 'resp_id')
        .addItem('Track Dynamics', 'dynam')
        .addSeparator()
        .addSubMenu(
            ui.createMenu('Transform multichoice')
                .addItem('Dichotomous', 'trf_dich')
                .addItem('Categorical', 'trf_cat')
        )
        .addSeparator()
        .addItem('Recode Numerically', 'num_recode')
        .addItem('Pivot', 'pivot')
        .addToUi();
};