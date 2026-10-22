function createTemplates(): void {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui } = context;

    try {
        const sheetsApi = typeof Sheets !== 'undefined' ? Sheets.Spreadsheets : undefined;
        if (!sheetsApi) return void ui.alert('Sheets advanced service is not enabled');

        const questionsSheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);
        if (questionsSheet) {
            const existResponse = ui.alert(
                `Sheet "${QUESTIONS_SHEET_NAME}" already exists. Do you want to delete it and create an empty template?`,
                ui.ButtonSet.YES_NO,
            );
            if (existResponse !== ui.Button.YES) return;
            spreadsheet.deleteSheet(questionsSheet);
        }

        const newQuestionsSheet = spreadsheet.insertSheet(QUESTIONS_SHEET_NAME);
        const headers = ['Q_ID', 'Q', 'Scale', 'Options', 'Cross_Options', 'Req'];
        newQuestionsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        SpreadsheetApp.flush();

        //dropdown options
        const dropdowns: Record<string, string[]> = {
            Scale: [
                //basic for research
                'Variants', 'Crosstab', 'Flags', 'Crossflag', 'Dropdown list',
                //qualitative
                'Text short', 'Text abstract',
                //special
                'Linear', 'Rating',
                //other
                'Date', 'Time', 'File upload'
            ],
            Options: ['Likert', 'Frequency'],
            Cross_Options: ['Animals'],
            Req: ['Yes', 'No']
        };

        const listRule = (items: string[]) => ({
            condition: { type: 'ONE_OF_LIST', values: items.map(v => ({ userEnteredValue: v })) },
        });

        const columnProperties = headers.map((name, i) => ({
            columnIndex: i,
            columnName: name,
            columnType: dropdowns[name] ? 'DROPDOWN' : name === 'Q_ID' ? 'DOUBLE' : 'TEXT',
            ...(dropdowns[name] && { dataValidationRule: listRule(dropdowns[name]) }),
        }));

        const request = {
            requests: [
                {
                    addTable: {
                        table: {
                            name: QUESTIONS_SHEET_NAME,
                            range: {
                                sheetId: newQuestionsSheet.getSheetId(),
                                startRowIndex: 0,
                                endRowIndex: 5,
                                startColumnIndex: 0,
                                endColumnIndex: headers.length,
                            },
                            columnProperties,
                        },
                    },
                },
            ],
        };

        sheetsApi.batchUpdate(
            request as unknown as GoogleAppsScript.Sheets.Schema.BatchUpdateSpreadsheetRequest,
            spreadsheet.getId(),
        );

        const sampleRows: (string | number)[][] = [
            [1, 'Rate your satisfaction', 'Variants', 'Likert', '', 'Yes'],
            [2, 'How often do you visit:', 'Crosstab', 'Frequency', 'Animals', 'Yes'],
        ];
        newQuestionsSheet.getRange(1, 1, 1 + sampleRows.length, headers.length).setValues([headers, ...sampleRows]);
        newQuestionsSheet.setColumnWidth(2, 450);

        const keepRows = 1 + sampleRows.length;
        const keepCols = headers.length;

        const maxRows = newQuestionsSheet.getMaxRows();
        if (maxRows > keepRows) newQuestionsSheet.deleteRows(keepRows + 1, maxRows - keepRows);
        const maxCols = newQuestionsSheet.getMaxColumns();
        if (maxCols > keepCols) newQuestionsSheet.deleteColumns(keepCols + 1, maxCols - keepCols);

        SpreadsheetApp.flush();
        ui.alert('Questions template created successfully');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}