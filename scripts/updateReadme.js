// @ts-check
import { spawnSync } from 'child_process';
import fs from 'fs';
import jju from 'jju';
import { readConfigs } from './readConfigs.js';

const comment = '<!-- start auto section -->';
const readmeFile = 'README.md';

let readme = fs.readFileSync(readmeFile, 'utf8').split(comment)[0];
readme += `${comment}\n`;

const configs = readConfigs();
for (const [configFile, { content, json }] of Object.entries(configs)) {
  const description = json.description ? `\n${json.description}\n` : '';
  delete json.description;
  delete json['$schema'];

  // const modifiedContent = jju.stringify(json, { indent: 2, mode: 'cjson' });
  const modifiedContent = jju
    .update(content, json, { indent: 2, mode: 'cjson' })
    .replace(/^ +\/\/ \/\/[\s\S]+?  \/\/ \}/gm, '');

  readme += `
### \`${configFile.replace(/\.json5$/, '')}\`
${description}
\`\`\`jsonc
${modifiedContent}
\`\`\`
`;
}

fs.writeFileSync(readmeFile, readme);
console.log('Updated readme. Formatting...');

spawnSync('yarn', ['prettier', '--write', 'README.md'], { stdio: 'inherit' });
