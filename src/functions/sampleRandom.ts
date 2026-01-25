const SAMPLE_SHEET_NAME: string = 'sample_random';
const CONF_LVL: number = 0.95;
const MARGIN_ERROR: number = 0.05;
const STDEV: number = 0.5;
const POS_CONF_LVLS: number[] = [0.80, 0.90, 0.95, 0.98, 0.99];
const POS_zScoreS: number[] = [1.282, 1.645, 1.960, 2.326, 2.576];
const TABLE_STRUCTURE: string[] = ['confidence level', 'margin of error', 'standard deviation', 'z-score', 'population', 'sample', 'target'];
const DEFAULT_CALC_DATA: [string, number][] = [['confidence level', CONF_LVL], ['margin of error', MARGIN_ERROR], ['standard deviation', STDEV], ['z-score', POS_zScoreS[2]]];

function sampleRandom(): void | GoogleAppsScript.Base.Button {
  const context = getSheetContext();
  if (!context) return;
  const { spreadsheet, ui } = context;
  try {
    const toCreateSheet: GoogleAppsScript.Spreadsheet.Sheet | null = spreadsheet.getSheetByName(SAMPLE_SHEET_NAME);
    if (!toCreateSheet) {
      const dialoguePopulation: GoogleAppsScript.Base.PromptResponse = ui.prompt(
        "Type the general population number",
        "Only INT type",
        ui.ButtonSet.OK_CANCEL,
      );
      const button: GoogleAppsScript.Base.Button = dialoguePopulation.getSelectedButton();
      const inputValues: string = dialoguePopulation.getResponseText();
      const population: number = parseInt(inputValues, 10);
      if (isNaN(population)) return ui.alert('Not a number');
      if (button == ui.Button.OK) {
        const sampleSheet: GoogleAppsScript.Spreadsheet.Sheet = spreadsheet.insertSheet().setName(SAMPLE_SHEET_NAME);
        sampleSheet.getRange(1, 1, DEFAULT_CALC_DATA.length, DEFAULT_CALC_DATA[0].length).setValues(DEFAULT_CALC_DATA);
        const sample: number = (Math.pow(POS_zScoreS[2], 2) * population * Math.pow(STDEV, 2)) / ((Math.pow(MARGIN_ERROR, 2) * population) + (Math.pow(POS_zScoreS[2], 2) * Math.pow(STDEV, 2)));
        const newCalcData: [string, number][] = [['population', population], ['sample', sample], ['target', sample / population]];
        sampleSheet.getRange(5, 1, newCalcData.length, newCalcData[0].length).setValues(newCalcData);
        sampleSheet.deleteRows(8, sampleSheet.getMaxRows() - 7);
        sampleSheet.deleteColumns(3, sampleSheet.getMaxColumns() - 2);
      } else {
        ui.alert('User aborted request');
      }
    } else {
      const firstColVals = toCreateSheet.getRange(1, 1, toCreateSheet.getLastRow()).getValues() as string[][];
      const indCols: number[] = Array.from({ length: firstColVals.length }, (e, i) => i + 1);
      const valueRowPairs: [string, number][] = firstColVals.map((row, i) => [row[0], indCols[i]]);
      const matchRowVals: [string, number][] = [];
      for (let i = 0; i < valueRowPairs.length; i++) {
        const curVal = String(valueRowPairs[i][0]).trim().toLowerCase();
        for (let u = 0; u < TABLE_STRUCTURE.length; u++) {
          const searchVal = String(TABLE_STRUCTURE[u]).trim().toLowerCase();
          if (curVal === searchVal) {
            matchRowVals.push(valueRowPairs[i]);
            break;
          }
        }
      }
      const userConfLevel: number = toCreateSheet.getRange(matchRowVals[0][1], 2).getValue();
      const userMarginError: number = toCreateSheet.getRange(matchRowVals[1][1], 2).getValue();
      const userSTDEV: number = toCreateSheet.getRange(matchRowVals[2][1], 2).getValue();
      const userPopulation: number = toCreateSheet.getRange(matchRowVals[4][1], 2).getValue();
      if (isNaN(Number(userConfLevel)) || isNaN(Number(userMarginError)) || isNaN(Number(userSTDEV)) || isNaN(Number(userPopulation))) return ui.alert('Some parameter is not a number');
      if (!POS_CONF_LVLS.includes(userConfLevel)) return ui.alert('Inappropriate confidence level (proper 0.80, 0.90, 0.95, 0.98, 0.99)');
      if (userMarginError < 0.01 || userMarginError > 0.05) return ui.alert('Inappropriate margin of error (proper [0.01; 0.05])');
      if (userSTDEV != 0.5) return ui.alert('Standard deviation cannot be other than 5');
      const zIndex: number = POS_CONF_LVLS.indexOf(userConfLevel);
      if (zIndex === -1) return ui.alert('Something went wrong with z-score defining');
      const zScore: number = POS_zScoreS[zIndex];
      const userSample: number = (Math.pow(zScore, 2) * userPopulation * Math.pow(userSTDEV, 2)) / ((Math.pow(userMarginError, 2) * userPopulation) + (Math.pow(zScore, 2) * Math.pow(userSTDEV, 2)));
      toCreateSheet.getRange(matchRowVals[3][1], 2).setValue(zScore);
      toCreateSheet.getRange(matchRowVals[5][1], 2).setValue(userSample);
      toCreateSheet.getRange(matchRowVals[6][1], 2).setValue(userSample / userPopulation);
      toCreateSheet.deleteRows(8, toCreateSheet.getMaxRows() - 7);
      toCreateSheet.deleteColumns(3, toCreateSheet.getMaxColumns() - 2);
      toCreateSheet.autoResizeColumns(1, 2);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.alert('Error occurred: ' + message);
  }
}