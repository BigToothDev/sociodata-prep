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
        .addSubMenu(
            ui.createMenu('Pivot')
                .addItem('Wide to Long', 'w2l_pivot')
        )
        .addItem('Dimensions', 'dimensions')
        .addSubMenu(
            ui.createMenu('Recode Numerically')
                .addItem('Wide', 'num_recode_wide')
                .addItem('Long', 'num_recode_long')
        )
        .addToUi();
};