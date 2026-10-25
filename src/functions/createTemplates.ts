function createTemplates(): void {
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui } = context;

    try {
        const sheetsApi = typeof Sheets !== 'undefined' ? Sheets.Spreadsheets : undefined;
        if (!sheetsApi) return void ui.alert('Sheets advanced service is not enabled');

        const questionsSheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);
        const scalesSheet = spreadsheet.getSheetByName(SCALES_SHEET_NAME);
        if (questionsSheet || scalesSheet) {
            const existingSheets = [questionsSheet, scalesSheet]
                .filter((sheet): sheet is GoogleAppsScript.Spreadsheet.Sheet => sheet !== null)
                .map(sheet => `"${sheet.getName()}"`)
                .join(' and ');
            const existResponse = ui.alert(
                `Sheet${questionsSheet && scalesSheet ? 's' : ''} ${existingSheets} already exists. Do you want to delete ${questionsSheet && scalesSheet ? 'them' : 'it'} and create new templates?`,
                ui.ButtonSet.YES_NO,
            );
            if (existResponse !== ui.Button.YES) return;
            if (questionsSheet) spreadsheet.deleteSheet(questionsSheet);
            if (scalesSheet) spreadsheet.deleteSheet(scalesSheet);
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
            [1, 'Would you say that you are happy?', 'Variants', 'Likert', '', 'Yes'],
            [2, 'How often have you seen these animals in the last month:', 'Crosstab', 'Frequency', 'Animals', 'Yes'],
        ];
        newQuestionsSheet.getRange(1, 1, 1 + sampleRows.length, headers.length).setValues([headers, ...sampleRows]);
        newQuestionsSheet.setColumnWidth(2, 450);

        const keepRows = 1 + sampleRows.length;
        const keepCols = headers.length;

        const maxRows = newQuestionsSheet.getMaxRows();
        if (maxRows > keepRows) newQuestionsSheet.deleteRows(keepRows + 1, maxRows - keepRows);
        const maxCols = newQuestionsSheet.getMaxColumns();
        if (maxCols > keepCols) newQuestionsSheet.deleteColumns(keepCols + 1, maxCols - keepCols);

        const newScalesSheet = spreadsheet.insertSheet(SCALES_SHEET_NAME);
        const scaleHeaders = ['Options', 'Code', 'Option'];
        const scaleRows: (string | number)[][] = [
            ['Likert', 1, 'Strongly disagree'],
            ['Likert', 2, 'Disagree'],
            ['Likert', 3, 'Neither agree nor disagree'],
            ['Likert', 4, 'Agree'],
            ['Likert', 5, 'Strongly agree'],
            ['Frequency', 1, 'Never'],
            ['Frequency', 2, 'Rarely'],
            ['Frequency', 3, 'Sometimes'],
            ['Frequency', 4, 'Often'],
            ['Frequency', 5, 'Always'],
            ['Animals', 1, 'Cat'],
            ['Animals', 2, 'Dog'],
            ['Animals', 3, 'Hamster']
        ];

        newScalesSheet.getRange(1, 1, 1, scaleHeaders.length).setValues([scaleHeaders]);
        SpreadsheetApp.flush();

        sheetsApi.batchUpdate(
            {
                requests: [
                    {
                        addTable: {
                            table: {
                                name: SCALES_SHEET_NAME,
                                range: {
                                    sheetId: newScalesSheet.getSheetId(),
                                    startRowIndex: 0,
                                    endRowIndex: 5,
                                    startColumnIndex: 0,
                                    endColumnIndex: scaleHeaders.length,
                                },
                                columnProperties: [
                                    {
                                        columnIndex: 0,
                                        columnName: 'Options',
                                        columnType: 'TEXT',
                                    },
                                    {
                                        columnIndex: 1,
                                        columnName: 'Code',
                                        columnType: 'DOUBLE',
                                    },
                                    {
                                        columnIndex: 2,
                                        columnName: 'Option',
                                        columnType: 'TEXT',
                                    },
                                ],
                            },
                        },
                    },
                ],
            } as unknown as GoogleAppsScript.Sheets.Schema.BatchUpdateSpreadsheetRequest,
            spreadsheet.getId(),
        );

        newScalesSheet.getRange(1, 1, 1 + scaleRows.length, scaleHeaders.length).setValues([scaleHeaders, ...scaleRows]);
        newScalesSheet.autoResizeColumns(1, scaleHeaders.length);

        const scaleKeepRows = 1 + scaleRows.length;
        const scaleKeepCols = scaleHeaders.length;
        const scaleMaxRows = newScalesSheet.getMaxRows();
        if (scaleMaxRows > scaleKeepRows) {
            newScalesSheet.deleteRows(scaleKeepRows + 1, scaleMaxRows - scaleKeepRows);
        }
        const scaleMaxCols = newScalesSheet.getMaxColumns();
        if (scaleMaxCols > scaleKeepCols) {
            newScalesSheet.deleteColumns(scaleKeepCols + 1, scaleMaxCols - scaleKeepCols);
        }

        SpreadsheetApp.flush();
        ui.alert('Questionnaire and scales templates created successfully');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}