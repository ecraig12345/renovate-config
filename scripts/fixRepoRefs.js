// @ts-check
import fs from 'fs';
import jju from 'jju';
import { readConfigs } from './readConfigs.js';

const defaultRepo = 'ecraig12345/renovate-config';

// fix repo references in config files to reflect the repo/branch being tested
const headRef = /** @type {string} */ (process.env.GITHUB_HEAD_REF);
const repo = /** @type {string} */ (process.env.GITHUB_REPOSITORY);

if (!headRef || !repo) {
  console.error('This script should only be run in CI');
  process.exit(1);
}

if (headRef !== 'main' || repo !== defaultRepo) {
  const configs = readConfigs();

  for (const [configFile, { json }] of Object.entries(configs)) {
    if (json.extends) {
      json.extends = json.extends.map((preset) => {
        preset = preset.replace(defaultRepo, repo);
        if (headRef !== 'main') {
          preset += `#${headRef}`;
        }
        return preset;
      });
      fs.writeFileSync(configFile, jju.stringify(json, { indent: 2, mode: 'cjson' }));
    }
  }
}
