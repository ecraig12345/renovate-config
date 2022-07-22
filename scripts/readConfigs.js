// @ts-check
import fs from 'fs';

const excludeFiles = ['package.json'];

/**
 * @returns {Record<string, { content: string; json: any }>}
 */
export function readConfigs() {
  const configFiles = fs
    .readdirSync(process.cwd())
    .filter((file) => /^[^.].*\.json$/.test(file) && !excludeFiles.includes(file));

  const configs = /** @type {*} */ ({});

  for (const configFile of configFiles) {
    const content = fs.readFileSync(configFile, 'utf8');
    configs[configFile] = { content, json: JSON.parse(content) };
  }

  return configs;
}
