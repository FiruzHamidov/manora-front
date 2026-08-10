import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const wizardSource = await readFile(
  new URL('../app/profile/add-post/_components/ListingWizard.tsx', import.meta.url),
  'utf8'
);
const formHookSource = await readFile(
  new URL('../hooks/useAddPostForm.ts', import.meta.url),
  'utf8'
);

test('add listing wizard does not render the building type selector', () => {
  assert.match(wizardSource, /mode === 'edit' && formData\.buildingTypes\.length > 0/);
  assert.doesNotMatch(wizardSource, /mode === 'add'[^\n]*Тип объекта/);
});

test('add listing does not require or invent a building status id', () => {
  assert.doesNotMatch(formHookSource, /!selectedBuildingType \|\|/);
  assert.doesNotMatch(formHookSource, /setSelectedBuildingType\(Number\(buildingTypes\[0\]\.id\)\)/);
  assert.match(formHookSource, /status_id: selectedBuildingType \?\? undefined/);
});
