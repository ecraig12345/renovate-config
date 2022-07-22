// @ts-check
import fs from 'fs';
import jju from 'jju';
import { readConfigs } from './readConfigs.js';

const defaultRepo = 'ecraig12345/renovate-config';

// fix repo references in config files to reflect the repo/branch being tested
const [headRef, repo] = process.argv.slice(2);
if (!headRef || !repo) {
  console.error('must provide head ref and repo as positional args');
  process.exit(1);
}

if (headRef !== 'main' || repo !== defaultRepo) {
  const configs = readConfigs();

  for (const [configFile, { json }] of Object.entries(configs)) {
    if (json.extends) {
      json.extends = json.extends.map((preset) => {
        if (preset.includes(defaultRepo)) {
          preset = preset.replace(defaultRepo, repo);
          if (headRef !== 'main') {
            preset += `#${headRef}`;
          }
        }
        return preset;
      });
      fs.writeFileSync(configFile, jju.stringify(json, { indent: 2, mode: 'cjson' }));
    }
  }
}
