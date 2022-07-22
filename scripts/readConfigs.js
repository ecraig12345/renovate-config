// @ts-check
import fs from 'fs';
import jju from 'jju';

/**
 * @returns {Record<string, { content: string; json: any }>}
 */
export function readConfigs() {
  const configFiles = fs.readdirSync(process.cwd()).filter((file) => /^[^.].*\.json5$/.test(file));
  const configs = /** @type {*} */ ({});

  for (const configFile of configFiles) {
    const content = fs.readFileSync(configFile, 'utf8');
    configs[configFile] = { content, json: jju.parse(content) };
  }

  return configs;
}
