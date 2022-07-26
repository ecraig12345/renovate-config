import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readConfigs } from './utils/readConfigs.js';

const comment = '<!-- start auto section -->';
const readmeFile = 'README.md';

let readme = fs.readFileSync(readmeFile, 'utf8').split(comment)[0];
readme += `${comment}\n`;

const configs = readConfigs();
for (const [configFile, { content, json }] of Object.entries(configs)) {
  const configName = path.basename(configFile, '.json');
  const description = json.description ? `\n${json.description}\n` : '';
  delete json.description;
  delete json['$schema'];

  const modifiedContent = JSON.stringify(content, null, 2);

  readme += `
### \`${configName}\`
${description}
\`\`\`jsonc
${modifiedContent}
\`\`\`
`;
}

fs.writeFileSync(readmeFile, readme);
console.log('Updated readme. Formatting...');

spawnSync('yarn', ['prettier', '--write', 'README.md'], { stdio: 'inherit' });
