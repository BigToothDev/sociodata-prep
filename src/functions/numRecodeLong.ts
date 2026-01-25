function numRecodeLong(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const dataHeaders: string[][] = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues();
        const dataCols: string[] = ['Q', 'Option'];
        const dataIndices: number[] = dataCols.map(item => dataHeaders[0].indexOf(item));
        const dataQs: string[][] = activeSheet.getRange(2, dataIndices[0] + 1, activeSheet.getLastRow()).getValues();
        const dataOpts: string[][] = activeSheet.getRange(2, dataIndices[1] + 1, activeSheet.getLastRow()).getValues();
        if (dataQs.length != dataOpts.length) return ui.alert('Diff length on columns');
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('No scales sheet found');
        const scaleHeaders: string[][] = scaleSheet.getRange(1, 1, 1, scaleSheet.getLastColumn()).getValues();
        const scaleCols: string[] = ['Question', 'Option', 'Code'];
        const scaleIndices: number[] = scaleCols.map(item => scaleHeaders[0].indexOf(item));
        if (scaleIndices.includes(-1)) return ui.alert('Missing some of input columns');
        const scaleQs = scaleSheet.getRange(2, scaleIndices[0] + 1, activeSheet.getLastRow()).getValues();
        const scaleOpts = scaleSheet.getRange(2, scaleIndices[1] + 1, activeSheet.getLastRow()).getValues();
        const scaleCodes = scaleSheet.getRange(2, scaleIndices[2] + 1, activeSheet.getLastRow()).getValues();
        if (scaleQs.length != scaleOpts.length || scaleQs.length != scaleCodes.length) return ui.alert('Diff lenght on columns');
        const recodedValues = [];
        for (let i = 0; i < dataQs.length; i++) {
            const question = dataQs[i][0];
            const option = dataOpts[i][0];
            let codeFound = -99;
            for (let j = 0; j < scaleQs.length; j++) {
                if (scaleQs[j][0] == question && scaleOpts[j][0] == option) {
                    codeFound = scaleCodes[j][0];
                    break;
                }
            }
            recodedValues.push([codeFound]);
        }
        activeSheet.getRange(2, activeSheet.getLastColumn() + 1, recodedValues.length).setValues(recodedValues);
        activeSheet.getRange(1, activeSheet.getLastColumn()).setValue('Code');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}