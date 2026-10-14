function getSelectedColumns(sheet: GoogleAppsScript.Spreadsheet.Sheet): Set<number> {
    const cols = new Set<number>();
    const ranges = sheet.getActiveRangeList()?.getRanges() ?? [];
    ranges.forEach(range => {
        const start = range.getColumn();
        for (let c = start; c < start + range.getNumColumns(); c++) {
            cols.add(c);
        }
    });
    return cols;
}