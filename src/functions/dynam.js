function create_new_dynamics_graph(parentsheet, datecolindex, childsheet) {
    let dataRange = parentsheet.getRange(2, datecolindex, parentsheet.getLastRow() - 1, 1);
    let values = dataRange.getValues();
    childsheet.getRange(1, 1, values.length, 1).setValues(values).setNumberFormat("dd.MM.yyyy HH:mm:ss")
    let counts = [];
    for (let i = 1; i <= values.length; i++) {
        counts.push([i]);
    };
    childsheet.getRange(1, 2, counts.length, 1).setValues(counts);
    let chartRange = childsheet.getRange(1, 1, childsheet.getLastRow(), 2);
    let chart = childsheet.newChart()
        .setPosition(1, 1, 0, 0)
        .setChartType(Charts.ChartType.LINE)
        .addRange(chartRange)
        .setOption('width', 1400)
        .setOption('height', 500)
        .setOption('title', 'Dynamics')
        .setOption('series', { 0: { color: '#1323e9' } })
        .build();
    childsheet.insertChart(chart);
};

function dynam() {
    const sheet_name = 'dynamics_';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const active_sheet = spreadsheet.getActiveSheet();
    const active_sheet_name = active_sheet.getName();
    const ui = SpreadsheetApp.getUi();

    if (!active_sheet) return ui.alert('No active sheet found');
    if (!spreadsheet.getSheetByName(sheet_name+active_sheet_name)) {
        let dynam_sheet = spreadsheet.insertSheet().setName(sheet_name+active_sheet_name);
        let rangeCols = active_sheet.getDataRange().getNumColumns();
        let allDateCols = [];
        for (let i = 1; i <= rangeCols; i++) {
            let cell = active_sheet.getRange(2, i);
            let val = cell.getValue();
            if (val instanceof Date) allDateCols.push(i);
        };
        if (allDateCols.length <= 0) {
            return ui.alert('Missing date-time column')
        } else if (allDateCols.length == 1) {
            create_new_dynamics_graph(active_sheet, allDateCols[0], dynam_sheet);
        } else if (allDateCols.length < 10) {
            let dialogue_choose_date_col = ui.prompt(
                "Choose the date column from existing",
                `Choose column number: ${allDateCols}`,
                ui.ButtonSet.OK_CANCEL,
            );
            let button = dialogue_choose_date_col.getSelectedButton();
            let input_value = dialogue_choose_date_col.getResponseText();
            if (button == ui.Button.OK) {
                if (isNaN(Number(input_value))) return ui.alert('Not a number');
                if (!allDateCols.includes(Number(input_value))) return ui.alert('Wrong date column');
                create_new_dynamics_graph(active_sheet, Number(input_value), dynam_sheet);
            } else {
                return ui.alert('User aborted request');
            };
        } else {
            return ui.alert('Too many date cols, over 10');
        };
    } else {
        return ui.alert('Sheet already exists');
        //Update existing sheet func will be added later
    };
};