type MultiChoiceDefinition = {
  type: 'Flags' | 'Crossflag';
  values: string[];
  crossValues: string[];
};

type MultiChoiceCatalog = Record<string, MultiChoiceDefinition>;

type ResolvedMultiChoiceHeader = {
  definition: MultiChoiceDefinition;
  crossValue?: string;
};

function loadMultiChoiceCatalog(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): { catalog?: MultiChoiceCatalog; error?: string } {
  //check scales sheet
  const scaleSheet = spreadsheet.getSheetByName(SCALES_SHEET_NAME);
  if (!scaleSheet) return { error: 'Scale sheet is missing' };
  if (scaleSheet.getLastRow() < 2) return { error: 'Scale sheet is empty' };
  //map options (Scales sheet) by set name
  const optionsBySet: Record<string, string[]> = {};
  scaleSheet.getRange(2, 1, scaleSheet.getLastRow() - 1, 3).getValues().forEach(row => {
    const setName = String(row[0] ?? '').trim();
    const option = String(row[2] ?? '').trim();
    if (setName && option) {
      if (!optionsBySet[setName]) {
        optionsBySet[setName] = [];
      }
      optionsBySet[setName].push(option);
    }
  });
  //check questionnaire sheet
  const questionsSheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);
  if (!questionsSheet) return { error: 'Questionnaire sheet is missing' };
  if (questionsSheet.getLastRow() < 2) return { error: 'Questionnaire sheet is empty' };
  //processing questions headers indices
  const questions = questionsSheet.getDataRange().getValues();
  const headers = questions[0].map(value => String(value).trim());
  const indices = ['Q', 'Scale', 'Options', 'Cross_Options'].map(name => headers.indexOf(name));
  if (indices.includes(-1)) return { error: 'Questionnaire: missing Q / Scale / Options / Cross_Options column' };
  const [qIndex, scaleIndex, optionsIndex, crossIndex] = indices;
  //make catalog of question name and options from two separate sheets (Scales and Questionnaire)
  const catalog: MultiChoiceCatalog = {};
  questions.slice(1).forEach(row => {
    const question = String(row[qIndex] ?? '').trim();
    const type = String(row[scaleIndex] ?? '').trim();
    if (!question || (type !== 'Flags' && type !== 'Crossflag')) return;

    const values = optionsBySet[String(row[optionsIndex] ?? '').trim()] ?? [];
    const crossValues = optionsBySet[String(row[crossIndex] ?? '').trim()] ?? [];
    if (values.length === 0 || (type === 'Crossflag' && crossValues.length === 0)) return;
    catalog[question] = { type, values, crossValues };
  });

  return { catalog };
}

function resolveMultiChoiceHeader(header: string, catalog: MultiChoiceCatalog): ResolvedMultiChoiceHeader | 'invalid-cross-value' | undefined {
  //direct match, with no [cross value]
  const direct = catalog[header];
  if (direct?.type === 'Flags') return { definition: direct };
  //crossflag match, with [cross value]
  const match = header.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
  if (!match) return undefined;
  //check if the base header exists in the catalog and is of type Crossflag
  const definition = catalog[match[1].trim()];
  if (!definition || definition.type !== 'Crossflag') return undefined;
  //check if the cross value is valid
  const crossValue = match[2].trim();
  if (!definition.crossValues.includes(crossValue)) return 'invalid-cross-value';
  return { definition, crossValue };
}