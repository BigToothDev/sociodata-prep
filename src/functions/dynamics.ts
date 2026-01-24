const DYNAM_SHEET_PREFIX: string = 'dynamics_';
const STRING_DATE_REGEX: RegExp = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;

function getDateFromTable(_Sheet: GoogleAppsScript.Spreadsheet.Sheet): number | null {
    let firstDateCol: number | null = null;
    const fullSecondRow: any[][] = _Sheet.getRange(2, 1, 1, _Sheet.getLastColumn()).getValues();
    for (let i: number = 0; i < fullSecondRow[0].length; i++) {
        const cellValue = fullSecondRow[0][i];
        if ((typeof cellValue === "string" && STRING_DATE_REGEX.test(cellValue)) || cellValue instanceof Date) {
            firstDateCol = i + 1;
            break;
        }
    }
    return firstDateCol;
}

function createDynamicsGraph(_dynamicsSheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const chartRange = _dynamicsSheet.getRange(1, 1, _dynamicsSheet.getLastRow(), 2);
    const chart = _dynamicsSheet.newChart()
        .setPosition(1, 1, 0, 0)
        .setChartType(Charts.ChartType.LINE)
        .addRange(chartRange)
        .setOption('width', 1400)
        .setOption('height', 600)
        .setOption('title', 'Dynamics')
        .setOption('series', { 0: { color: '#1323e9' } })
        .setOption('hAxis', { title: 'Date' })
        .setOption('vAxis', { title: 'Count' })
        .build();
    _dynamicsSheet.insertChart(chart);
}

function dynamics(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const activeSheetName: string = activeSheet.getName();
        if (activeSheetName.startsWith(DYNAM_SHEET_PREFIX)) {
            const parentNameToFind = activeSheetName.replace(DYNAM_SHEET_PREFIX, '');
            const parentSheet = spreadsheet.getSheetByName(parentNameToFind);
            if (parentSheet) {
                const dateCol = getDateFromTable(parentSheet);
                if (dateCol) {
                    if (parentSheet.getLastRow() - 1 > activeSheet.getLastRow() || parentSheet.getLastRow() - 1 < activeSheet.getLastRow()) {
                        const parentSheetData: Date[][] | string[][] = parentSheet.getRange(2, dateCol, parentSheet.getLastRow() - 1, 1).getValues();
                        const indices = Array.from({ length: parentSheetData.length }, (_, i) => i + 1);
                        activeSheet.getCharts().forEach(chart => activeSheet.removeChart(chart));
                        activeSheet.clear();
                        activeSheet.getRange(1, 1, parentSheetData.length, 1).setValues(parentSheetData).setNumberFormat("dd.MM.yyyy HH:mm:ss");
                        activeSheet.getRange(1, 2, indices.length, 1).setValues(indices.map(i => [i])).setNumberFormat("0");
                        createDynamicsGraph(activeSheet);
                    } else {
                        return ui.alert('Dynamics sheet is up-to-date');
                    }
                } else {
                    return ui.alert('Date column missing in parent sheet: ' + parentNameToFind);
                }
            } else {
                return ui.alert('Parent sheet not found: ' + parentNameToFind);
            }
        } else {
            const childSheet = spreadsheet.getSheetByName(DYNAM_SHEET_PREFIX + activeSheetName);
            if (childSheet) {
                const dateCol = getDateFromTable(activeSheet);
                if (dateCol) {
                    if (activeSheet.getLastRow() - 1 > childSheet!.getLastRow() || activeSheet.getLastRow() - 1 < childSheet!.getLastRow()) {
                        const activeSheetData: Date[][] | string[][] = activeSheet.getRange(2, dateCol, activeSheet.getLastRow() - 1, 1).getValues();
                        const indices = Array.from({ length: activeSheetData.length }, (_, i) => i + 1);
                        childSheet.getCharts().forEach(chart => childSheet!.removeChart(chart));
                        childSheet.clear();
                        childSheet.getRange(1, 1, activeSheetData.length, 1).setValues(activeSheetData).setNumberFormat("dd.MM.yyyy HH:mm:ss");
                        childSheet.getRange(1, 2, indices.length, 1).setValues(indices.map(i => [i])).setNumberFormat("0");
                        createDynamicsGraph(childSheet);
                    } else {
                        return ui.alert('Dynamics sheet is up-to-date');
                    }
                } else {
                    return ui.alert('Date column missing in active sheet');
                }
            } else {
                const dateCol = getDateFromTable(activeSheet);
                if (dateCol) {
                    const newChildSheet = spreadsheet.insertSheet(DYNAM_SHEET_PREFIX + activeSheetName);
                    const activeSheetData: Date[][] | string[][] = activeSheet.getRange(2, dateCol, activeSheet.getLastRow() - 1, 1).getValues();
                    const indices = Array.from({ length: activeSheetData.length }, (_, i) => i + 1);
                    newChildSheet.getRange(1, 1, activeSheetData.length, 1).setValues(activeSheetData).setNumberFormat("dd.MM.yyyy HH:mm:ss");
                    newChildSheet.getRange(1, 2, indices.length, 1).setValues(indices.map(i => [i])).setNumberFormat("0");
                    createDynamicsGraph(newChildSheet);
                } else {
                    return ui.alert('Date column missing in active sheet');
                }
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}