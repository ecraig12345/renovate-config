// @ts-check
import fs from 'fs';
import glob from 'glob';
import jju from 'jju';

const defaultRepo = 'ecraig12345/renovate-config';

const configFiles = glob.sync('./*.json5', { dot: false });

// fix repo references in config files to reflect the repo/branch being tested
const headRef = /** @type {string} */ (process.env.GITHUB_HEAD_REF);
const repo = /** @type {string} */ (process.env.GITHUB_REPOSITORY);
if (headRef !== 'main' || repo !== defaultRepo) {
  for (const configFile of configFiles) {
    const content = fs.readFileSync(configFile, 'utf8');
    /** @type {{ extends?: string[] }} */
    const json = jju.parse(content);
    if (json.extends) {
      json.extends = json.extends.map((preset) => {
        preset = preset.replace(defaultRepo, repo);
        if (headRef !== 'main') {
          preset += `#${headRef}`;
        }
        return preset;
      });
    }
    fs.writeFileSync(configFile, jju.stringify(json, { indent: 2 }));
  }
}
