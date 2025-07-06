function sample_rand() {
  const sheet_name = 'sample_rand';
  const conf_lvl = 0.95;
  const margin_error = 0.05;
  const stdev = 0.5;
  const pos_conf_lvls = [0.80, 0.90, 0.95, 0.98, 0.99];
  const pos_z_score = [1.282, 1.645, 1.960, 2.326, 2.576];
  //let z_score_80 = 1.282; let z_score_90 = 1.645; let z_score_95 = 1.960; let z_score_98 = 2.326; let z_score_99 = 2.576;
  const table_structure = ['confidence level', 'margin of error', 'standard deviation', 'z-score', 'population', 'sample', 'target']
  const default_calc_data = [['confidence level', conf_lvl], ['margin of error', margin_error], ['standard deviation', stdev], ['z-score', pos_z_score[2]]];

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  let active_sheet = spreadsheet.getActiveSheet();
  let to_create_sheet = spreadsheet.getSheetByName(sheet_name);
  if (!active_sheet) return ui.alert('No active sheet found');
  if (!to_create_sheet) {
    let dialogue_population = ui.prompt(
      "Type the general population number",
      "Only INT type",
      ui.ButtonSet.OK_CANCEL,
    );
    let button = dialogue_population.getSelectedButton();
    let input_value = dialogue_population.getResponseText();
    let population = parseInt(input_value, 10);
    if (isNaN(population)) return ui.alert('Not a number');
    if (button == ui.Button.OK) {
      let sample_sheet = spreadsheet.insertSheet().setName('sample_rand');
      sample_sheet.getRange(1, 1, default_calc_data.length, default_calc_data[0].length).setValues(default_calc_data);
      let sample = (Math.pow(pos_z_score[2], 2) * population * Math.pow(stdev, 2)) / ((Math.pow(margin_error, 2) * population) + (Math.pow(pos_z_score[2], 2) * Math.pow(stdev, 2)));
      let new_calc_data = [['population', population], ['sample', sample], ['target', sample / population]];
      sample_sheet.getRange(5, 1, new_calc_data.length, new_calc_data[0].length).setValues(new_calc_data);
    } else {
      ui.alert('User aborted request')
    };
  } else {
    let firstColVals = to_create_sheet.getRange(1, 1, to_create_sheet.getLastRow()).getValues();
    let indCols = Array.from({ length: firstColVals.length }, (e, i) => i + 1);
    let valueRowPairs = firstColVals.map((row, i) => [row[0], indCols[i]]);
    let matchRowVals = [];
    for (let i = 0; i < valueRowPairs.length; i++) {
      let curVal = String(valueRowPairs[i][0]).trim().toLowerCase();
      for (let u = 0; u < table_structure.length; u++) {
        let searchVal = String(table_structure[u]).trim().toLowerCase();
        if (curVal === searchVal) {
          matchRowVals.push(valueRowPairs[i]);
          break;
        };
      };
    };
    let user_conf_lvl = to_create_sheet.getRange(matchRowVals[0][1], 2).getValue();
    let user_margin_err = to_create_sheet.getRange(matchRowVals[1][1], 2).getValue();
    let user_stdev = to_create_sheet.getRange(matchRowVals[2][1], 2).getValue();
    let user_population = to_create_sheet.getRange(matchRowVals[4][1], 2).getValue();
    if (isNaN(Number(user_conf_lvl)) || isNaN(Number(user_margin_err)) || isNaN(Number(user_stdev)) || isNaN(Number(user_population))) return ui.alert('Some parameter is not a number');
    if (!pos_conf_lvls.includes(user_conf_lvl)) return ui.alert('Inappropriate confidence level (proper 0.80, 0.90, 0.95, 0.98, 0.99)');
    if (user_margin_err < 0.01 || user_margin_err > 0.05) return ui.alert('Inappropriate margin of error (proper [0.01; 0.05])');
    if (user_stdev != 0.5) return ui.alert('Standard deviation cannot be other than 5');
    let z_index = pos_conf_lvls.indexOf(user_conf_lvl);
    if (z_index === -1) return ui.alert('Something went wrong with z-score defining');
    let z_score = pos_z_score[z_index];
    let user_sample = (Math.pow(z_score, 2) * user_population * Math.pow(user_stdev, 2)) / ((Math.pow(user_margin_err, 2) * user_population) + (Math.pow(z_score, 2) * Math.pow(user_stdev, 2)));
    to_create_sheet.getRange(matchRowVals[3][1], 2).setValue(z_score);
    to_create_sheet.getRange(matchRowVals[5][1], 2).setValue(user_sample);
    to_create_sheet.getRange(matchRowVals[6][1], 2).setValue(user_sample / user_population);
  };
};