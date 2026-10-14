function numRecodeLong(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const dataHeaders: string[][] = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues();
        const dataCols: string[] = ['Q', 'Option'];
        const dataIndices: number[] = dataCols.map(item => dataHeaders[0].indexOf(item));

        if (dataIndices.includes(-1)) return ui.alert('Missing Q or Option column in the active sheet');

        const dataQs: string[][] = activeSheet.getRange(2, dataIndices[0] + 1, activeSheet.getLastRow() - 1).getValues();
        const dataOpts: string[][] = activeSheet.getRange(2, dataIndices[1] + 1, activeSheet.getLastRow() - 1).getValues();
        if (dataQs.length != dataOpts.length) return ui.alert('Diff length on columns');

        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('No scales sheet found');
        const scalesData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 3).getValues();

        const questionsSheet = spreadsheet.getSheetByName('questions');
        if (!questionsSheet) return ui.alert('No questions sheet found');
        const questionsData = questionsSheet.getRange(2, 1, questionsSheet.getLastRow() - 1, 5).getValues();

        const setByQuestion: Record<string, string> = {};
        questionsData.forEach(row => {
            const q = String(row[1]).trim();
            if (q) setByQuestion[q] = String(row[3]).trim();
        });

        const codeByKey: Record<string, string | number> = {};
        scalesData.forEach(row => {
            const setName = String(row[0]).trim();
            const optionText = String(row[2]).trim();
            if (!setName || !optionText) return;
            codeByKey[`${setName}||${optionText}`] = row[1];
        });

        const recodedValues: (string | number)[][] = [];
        for (let i = 0; i < dataQs.length; i++) {
            const question = String(dataQs[i][0]).trim();
            const option = String(dataOpts[i][0]).trim();

            let codeFound: string | number = -99;
            const setName = setByQuestion[question];
            if (setName) {
                const key = `${setName}||${option}`;
                if (key in codeByKey) codeFound = codeByKey[key];
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