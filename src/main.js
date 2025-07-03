function onOpen() {
    let ui = SpreadsheetApp.getUi();
    ui.createMenu('SD-prep')
        .addSubMenu(
            ui.createMenu('Recode')
                .addItem('Dichotomous', 'recode_dich')
                .addItem('Categorical', 'recode_cat')
        )
        .addSeparator()
        .addItem('Add Response IDs', "resp_id")
        .addItem('Track Dynamics', 'dynam')
        .addToUi();
};