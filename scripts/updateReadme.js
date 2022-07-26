import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readPresets } from './utils/readPresets.js';

const heading = '\n## Available presets\n';
const readmeFile = 'README.md';

const originalReadme = fs.readFileSync(readmeFile, 'utf8').replace(/\r?\n/g, '\n');
if (!originalReadme.includes(heading)) {
  console.error(
    `Heading "${heading.trim()}" not found in ${readmeFile}. ` +
      `If the heading text has changed, please update scripts/validateReadme.js.`
  );
  process.exit(1);
}

const [firstSection, presetsAndAfter] = originalReadme.split(heading);
const [presetsSection, maybeLastSection] = presetsAndAfter.split(/^## /m);
const presetItems = presetsSection.split(/^(?=### )/gm);

let readme = firstSection + heading;

const presets = readPresets();
for (const [presetFile, { content, json }] of Object.entries(presets)) {
  const presetName = path.basename(presetFile, '.json');
  const description = json.description ? `\n${json.description}\n` : '';
  delete json.description;
  delete json['$schema'];

  const modifiedContent = JSON.stringify(content, null, 2);

  readme += `
### \`${presetName}\`
${description}
\`\`\`jsonc
${modifiedContent}
\`\`\`
`;
}

readme += maybeLastSection;

fs.writeFileSync(readmeFile, readme);
console.log('Updated readme. Formatting...');

spawnSync('yarn', ['prettier', '--write', 'README.md'], { stdio: 'inherit' });
