import fs from 'fs';
import path from 'path';
import { logError } from './github.js';
import { root } from './paths.js';

const excludeFiles = ['jsconfig.json', 'package.json'];

/**
 * @returns {Record<string, { content: string; json: any }>} mapping from config absolute path to content
 */
export function readConfigs() {
  const configFiles = fs
    .readdirSync(root)
    .filter((file) => /^[^.].*\.json$/.test(file) && !excludeFiles.includes(file));

  if (!configFiles.length) {
    logError('No configs found under ' + root);
    process.exit(1);
  }

  const configs = /** @type {*} */ ({});

  for (const configFile of configFiles) {
    const configPath = path.join(root, configFile);
    const content = fs.readFileSync(configPath, 'utf8');
    configs[configPath] = { content, json: JSON.parse(content) };
  }

  return configs;
}
