import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { defaultRepo } from './utils/github.js';
import { readPresets } from './utils/readPresets.js';

const readmeFile = 'README.md';
const importantConfigs = ['default', 'libraryRecommended'];
const comment = (content) => `<!-- ${content} -->`;
const startComment = comment('start presets');
const endComment = comment('end presets');
const startExtraComment = comment('start extra content (EDITABLE between these comments)');
const endExtraComment = comment('end extra content');

// read the readme and replace newlines for ease of processing
const originalReadme = fs.readFileSync(readmeFile, 'utf8').replace(/\r?\n/g, '\n');

if (!originalReadme.includes(startComment) || !originalReadme.includes(endComment)) {
  console.error(
    `Readme must contain these section marker comments:\n${startComment}\n${endComment}`
  );
  process.exit(1);
}

const presets = readPresets();
const presetNames = Object.keys(presets).map((p) => path.basename(p, '.json'));

const [startSection, presetsAndAfter] = originalReadme.split(startComment);
const [presetsSection, endSection] = presetsAndAfter.split(endComment);

// Get any extra text added for each preset
/** @type {{ [presetName: string]: string }} */
const oldPresetTexts = {};
presetsSection
  .trim()
  .split(/^(?=### `.+?`\n)/gm)
  .forEach((text) => {
    const presetName = (text.match(/^### `(.+?)`/) || [])[1];
    if (!presetName) {
      console.warn('Section REMOVED since it did not match expected format:\n', text);
    } else if (!presetNames.includes(presetName)) {
      console.warn(`Section "${presetName}" REMOVED since a matching file was not found`);
    } else if (!text.includes(startExtraComment) || !text.includes(endExtraComment)) {
      console.warn(`Section "${presetName}" REMOVED since marker comments are missing`);
    } else {
      oldPresetTexts[presetName] = text.split(startExtraComment)[1].split(endExtraComment)[0];
    }
  });

const newPresetSections = Object.entries(presets)
  .map(([presetFile, { json }]) => {
    const presetName = path.basename(presetFile, '.json');
    const extendsName = `github>${defaultRepo}${presetName === 'default' ? '' : `:${presetName}`}`;

    const description = json.description;
    delete json.description;
    delete json['$schema'];

    const extraContent = oldPresetTexts[presetName] || '';

    const modifiedJson = JSON.stringify(json, null, 2);
    return {
      name: presetName,
      content: `
### \`${presetName}\`

In your \`extends\` config: \`"${extendsName}"\`

${description || ''}

${startExtraComment}
${extraContent}
${endExtraComment}

\`\`\`json
${modifiedJson}
\`\`\`
`,
    };
  })
  .sort((a, b) => (importantConfigs.includes(a.name) ? -1 : 0))
  .map(({ content }) => content);

fs.writeFileSync(
  readmeFile,
  [startSection, startComment, ...newPresetSections, endComment, endSection].join('\n')
);

console.log('\nUpdated readme. Formatting...');
spawnSync('yarn', ['prettier', '--write', 'README.md'], { stdio: 'inherit' });
