import fs from 'fs';
import path from 'path';
import { logError } from './github.js';
import { root } from './paths.js';

const excludeFiles = ['jsconfig.json', 'package.json'];

/**
 * @returns {Record<string, { content: string; json: any }>} mapping from preset absolute path to content
 */
export function readPresets() {
  const presetFiles = fs
    .readdirSync(root)
    .filter((file) => /^[^.].*\.json$/.test(file) && !excludeFiles.includes(file));

  if (!presetFiles.length) {
    logError('No presets found under ' + root);
    process.exit(1);
  }

  const presets = /** @type {*} */ ({});

  for (const preset of presetFiles) {
    const presetPath = path.join(root, preset);
    const content = fs.readFileSync(presetPath, 'utf8');
    presets[presetPath] = { content, json: JSON.parse(content) };
  }

  return presets;
}
