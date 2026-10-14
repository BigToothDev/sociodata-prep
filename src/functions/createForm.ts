interface FormCreationResult {
    formId: string;
    editUrl: string;
    publishedUrl: string;
}
const createFormHeaders = ['Q_ID', 'Q', 'Scale type', 'Response type', 'Required'];
const scaleHeaders = ['Response type', 'Code', 'Option']
const possibleScaleTypes = ['Text', 'Options', 'File upload', 'Linear', 'Crosstab', 'Crossflags', 'Date', 'Time'];
const requiredScaleTypes = [true, false];

function createForm(): void | GoogleAppsScript.Base.Button | FormCreationResult {
    /*Q_ID
    Q (name)
    Scale type: text (short, abstract), options (variants, flags, dropdown list), file upload, linear, crosstab, crossflags, date, time
    Response type (within separate sheets lsit of options to paste inside)
    Required: boolean
    */
    const context = getSheetContext();
    if (!context) return;
    const { spreadsheet, ui, activeSheet } = context;
    try {
        //check if scale sheet is correct
        const scaleSheet = spreadsheet.getSheetByName('scales');
        if (!scaleSheet) return ui.alert('Scale sheet is missing');
        const scaleSheetHeaders = scaleSheet.getRange(1, 1, 1, scaleSheet.getLastColumn()).getValues() as string[][];
        const missingScaleHeaders = scaleHeaders.filter(header => !scaleSheetHeaders[0].includes(header));
        if (missingScaleHeaders.length > 0) {
            return ui.alert(`Missing required headers in the scale sheet: ${missingScaleHeaders.join(', ')}`);
        }

        //check active sheet headers
        const lastRow = activeSheet.getLastRow();
        if (lastRow < 2) {
            return ui.alert('No questions found in the active sheet.');
        }
        const dataRange = activeSheet.getRange(1, 1, lastRow, activeSheet.getLastColumn());
        const values = dataRange.getValues() as string[][];
        const headerRow = values[0];
        const dataRows = values.slice(1);

        const headerIndexMap: Record<string, number> = {};
        createFormHeaders.forEach(header => {
            headerIndexMap[header] = headerRow.indexOf(header);
        });

        const missingHeaders = createFormHeaders.filter(header => headerIndexMap[header] === -1);
        if (missingHeaders.length > 0) {
            return ui.alert(`Missing required headers in the active sheet: ${missingHeaders.join(', ')}`);
        }

        const incompleteRows: number[] = [];
        dataRows.forEach((row, i) => {
            const sheetRowNum = i + 2;
            const missingInRow = createFormHeaders.filter(header => {
                const val = row[headerIndexMap[header]];
                return val === '' || val === null || val === undefined;
            });
            if (missingInRow.length > 0) {
                incompleteRows.push(sheetRowNum);
            }
        });

        if (incompleteRows.length > 0) {
            return ui.alert(`Missing required data in row(s): ${incompleteRows.join(', ')}`);
        }        

        const form = FormApp.create('New Form');
        const formId = form.getId();
        const editUrl = form.getEditUrl();
        const publishedUrl = form.getPublishedUrl();
        return { formId, editUrl, publishedUrl };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ui.alert('Error occurred: ' + message);
    }
}