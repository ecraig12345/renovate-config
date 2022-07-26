import fs from 'fs';
import path from 'path';
import { getEnv } from './utils/getEnv.js';
import { isGithub, logEndGroup, logError, logGroup } from './utils/github.js';
import { root } from './utils/paths.js';
import { readConfigs } from './utils/readConfigs.js';
import { runBin } from './utils/runBin.js';

const defaultRepo = 'ecraig12345/renovate-config';
const ref = getEnv('GITHUB_REF', isGithub);
const repository = getEnv('GITHUB_REPOSITORY', isGithub);
const token = getEnv('TOKEN', isGithub);

if (!isGithub || ref !== 'refs/heads/main' || repository !== defaultRepo) {
  // This would be possible but complex to test when running against a github branch, and likely
  // not possible to completely test locally. Steps for testing against a github branch:
  // - Modify the config files to point to a temporary generated tag name
  // - Commit the modified files and create the tag
  // - Push the tag (don't push the commit to the branch)
  //   - Not sure if this would work for fork PRs, and we don't want a fork's unvalidated
  //     changes pushed to a tag in the main repo
  // - Run the test
  // - Delete the tag
  console.log(
    'Skipping full Renovate test run (only meaningful after configs are checked in to main)'
  );
  process.exit(0);
}

const configs = readConfigs();

const logFile = path.join(root, 'renovate.log');
fs.writeFileSync(logFile, ''); // Renovate wants this to exist already

// https://docs.renovatebot.com/self-hosted-configuration/
const selfHostedConfig = {
  platform: 'github',
  endpoint: 'https://github.com',
  repositories: [defaultRepo],
  hostRules: [{ abortOnError: true }],
  logFile,
  logFileLevel: 'debug',
  token,
  // force an "extends" config with all the presets from this repo
  force: {
    extends: [Object.keys(configs).map((c) => `${defaultRepo}:${path.basename(c, '.json')}`)],
    printConfig: true,
  },
};
// Normally the Renovate server config would be JS, but Renovate seems to have trouble importing
// the JS config due to this package having type: module (and fails with a misleading error).
// So write the config to JSON instead.
// Also, use .json5 to ensure it's not interpreted as a preset by any other steps.
const configFile = path.join(root, 'renovate-config.json5');
const configContent = JSON.stringify(selfHostedConfig, null, 2);
fs.writeFileSync(configFile, configContent);

logGroup('Renovate server config:');
console.log(configContent);
logEndGroup();

logGroup('Running Renovate');
const result = runBin('renovate', ['--dry-run'], {
  env: { GITHUB_COM_TOKEN: token, LOG_LEVEL: 'debug', RENOVATE_CONFIG_PATH: configFile },
});
logEndGroup();

if (result.status !== 0) {
  logError('Error running Renovate to test the configs');
  logGroup('Renovate log file');
  console.log(fs.readFileSync(logFile, 'utf8'));
  logEndGroup();
  process.exit(1);
}
