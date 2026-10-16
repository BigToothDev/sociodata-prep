function numRecodeLong(): void | GoogleAppsScript.Base.Button {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        const dataHeaders: string[][] = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues();
        const dataCols: string[] = ['Q', 'Option'];
        const dataIndices: number[] = dataCols.map(item => dataHeaders[0].indexOf(item));

        if (dataIndices.includes(-1)) return ui.alert('Missing Q or Option column in the active sheet');

        if (activeSheet.getLastRow() < 2) return ui.alert('No data rows on the active sheet');

        const dataQs: string[][] = activeSheet.getRange(2, dataIndices[0] + 1, activeSheet.getLastRow() - 1).getValues();
        const dataOpts: string[][] = activeSheet.getRange(2, dataIndices[1] + 1, activeSheet.getLastRow() - 1).getValues();
        if (dataQs.length != dataOpts.length) return ui.alert('Diff length on columns');

        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('No scales sheet found');

        if (scaleSheet.getLastRow() < 2) return ui.alert('Scale sheet is empty');
        const scalesData = scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 3).getValues();

        const questionsSheet = spreadsheet.getSheetByName('questions');
        if (!questionsSheet) return ui.alert('No questions sheet found');

        if (questionsSheet.getLastRow() < 2) return ui.alert('Questions sheet is empty');

        const questionsAll = questionsSheet.getDataRange().getValues();
        const qHeaders: string[] = questionsAll[0].map(h => String(h).trim());
        const iQ = qHeaders.indexOf('Q');
        const iScale = qHeaders.indexOf('Scale');
        const iCross = qHeaders.indexOf('Cross_Options');
        const iOpt = qHeaders.indexOf('Options');
        if ([iQ, iScale, iCross, iOpt].includes(-1)) {
            return ui.alert('questions: missing Q / Scale / Cross_Options / Options column');
        }
        const questionsData = questionsAll.slice(1);

        const byQ: Record<string, QDef> = {};
        questionsData.forEach(row => {
            const q = String(row[iQ]).trim();
            if (!q) return;
            byQ[q] = {
                type: String(row[iScale]).trim(),
                crossSet: String(row[iCross]).trim(),
                optSet: String(row[iOpt]).trim(),
            };
        });

        const codeByKey: Record<string, string | number> = {};
        const valuesBySet: Record<string, Set<string>> = {};
        scalesData.forEach(row => {
            const setName = String(row[0]).trim();
            const optionText = String(row[2]).trim();
            if (!setName || !optionText) return;
            codeByKey[`${setName}||${optionText}`] = row[1];
            (valuesBySet[setName] ??= new Set<string>()).add(optionText);
        });

        const recodedValues: (string | number)[][] = [];
        const badQs = new Set<string>();
        for (let i = 0; i < dataQs.length; i++) {
            const question = String(dataQs[i][0]).trim();
            const option = String(dataOpts[i][0]).trim();

            const optionUpper = option.toUpperCase();
            if (optionUpper === 'TRUE' || optionUpper === 'FALSE') {
                recodedValues.push([optionUpper === 'TRUE' ? TRUE_CODE : FALSE_CODE]);
                continue;
            }

            let setName: string | undefined;

            const slot = parseSlotHeader(question, byQ, (s, v) => !!valuesBySet[s]?.has(v));
            const isSlot = slot.status !== 'none';

            if (isSlot) {
                if (slot.status === 'ok') setName = slot.optSet;
                else badQs.add(question);
            } else {
                const direct = byQ[question];
                if (direct) {
                    if (direct.type === 'Variants') setName = direct.optSet;
                } else {
                    const m = question.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
                    const def = m ? byQ[m[1].trim()] : undefined;
                    if (m && def && def.type === 'Crosstab') {
                        if (valuesBySet[def.crossSet]?.has(m[2].trim())) setName = def.optSet;
                        else badQs.add(question);
                    }
                }
            }

            if (isSlot && option === '') {
                recodedValues.push(['']);
                continue;
            }

            let codeFound: string | number = -99;
            if (setName) {
                const key = `${setName}||${option}`;
                if (key in codeByKey) codeFound = codeByKey[key];
            }
            recodedValues.push([codeFound]);
        }
        activeSheet.getRange(2, activeSheet.getLastColumn() + 1, recodedValues.length).setValues(recodedValues);
        activeSheet.getRange(1, activeSheet.getLastColumn()).setValue('Code');

        if (badQs.size > 0) {
            ui.alert('Not recoded (value in [] not found in Cross_Options, or unknown R_Option question):\n' + Array.from(badQs).join('\n'));
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}