function onOpen() {
    let ui = SpreadsheetApp.getUi();
    ui.createMenu('SD-prep')
        .addItem('Calculate sample', 'sample_rand')
        .addItem('Add Response IDs', 'resp_id')
        .addItem('Track Dynamics', 'dynam')
        .addSeparator()
        .addSubMenu(
            ui.createMenu('Transform multichoice')
                .addItem('Dichotomous', 'trf_dich')
                .addItem('Categorical', 'trf_cat')
        )        
        .addToUi();
};