import fs from 'fs';
import path from 'path';
import { getEnv } from './utils/getEnv.js';
import { defaultRepo, isGithub, logEndGroup, logError, logGroup } from './utils/github.js';
import { root } from './utils/paths.js';
import { readPresets } from './utils/readPresets.js';
import { runBin } from './utils/runBin.js';

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

const presets = readPresets();

const logFile = path.join(root, 'renovate.log');
fs.writeFileSync(logFile, ''); // Renovate wants this to exist already

// https://docs.renovatebot.com/self-hosted-configuration/
const selfHostedConfig = {
  repositories: [defaultRepo],
  hostRules: [{ abortOnError: true }],
  logFile,
  logFileLevel: 'debug',
  token,
  // force an "extends" config with all the presets from this repo
  force: {
    extends: Object.keys(presets).map((p) => `${defaultRepo}:${path.basename(p, '.json')}`),
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
// All we really need here is the config validation, so do the shortest type of dry run
// https://docs.renovatebot.com/self-hosted-configuration/#dryrun
const result = runBin('renovate', ['--dry-run=extract'], {
  env: { LOG_LEVEL: 'info', RENOVATE_CONFIG_FILE: configFile },
});
logEndGroup();

if (result.status !== 0) {
  logRenovateError();
  process.exit(1);
}

/**
 * @typedef {{
 *   msg: string;
 *   level: 10 | 20 | 30 | 40 | 50 | 60;
 *   err?: Error & { err?: Error & {} };
 * }} RenovateLog Entry in Renovate's log file
 * @typedef {RenovateLog & { preset: string }} RenovatePresetDebugLog
 */

/** @param {RenovateLog} log */
function logRenovateErrorDetails(log) {
  const { err } = log;
  if (!err) return;

  logGroup('Error details');

  // Typically the inner error in Renovate logs is the one with interesting content.
  // For example, if a preset name is invalid, this is where you'll find the 404 HTTPError.
  const innerError = /** @type {(Error & Record<string, any>) | undefined} */ (err.err);
  if (innerError?.name === 'HTTPError') {
    console.log(`HTTP error requesting ${innerError.options?.url}`);
    console.log(innerError.message);
  }

  // The outer error will likely have a better stack in the case of async HTTP errors
  console.log('\nOuter error:');
  console.log(err.stack);

  if (innerError) {
    console.log('\nOriginal error:');
    console.log(JSON.stringify(innerError, null, 2));
  }

  logEndGroup();
}

function logRenovateError() {
  // Each line in the log file is a JSON blob
  /** @type {RenovateLog[]} */
  const logs = fs
    .readFileSync(logFile, 'utf8')
    .split(/\r?\n/g)
    .map((str) => {
      try {
        return JSON.parse(str);
      } catch (err) {}
    })
    .filter((l) => !!l);

  const invalidPresetLog = logs.find((l) => !!l.err && l.msg === 'config-presets-invalid');
  if (invalidPresetLog) {
    // As of writing, there's only a debug log which directly includes the name of the preset that
    // failed to validate (it's not included in any of the higher-severity logs)
    const presetDebugLog = /** @type {RenovatePresetDebugLog | undefined} */ (
      logs.find((l) => !!l.err && /** @type {RenovatePresetDebugLog} */ (l).preset)
    );

    if (presetDebugLog) {
      logError(`Preset "${presetDebugLog.preset}" is invalid`);
      logRenovateErrorDetails(presetDebugLog);
    } else {
      logError('A preset failed to validate');
      logRenovateErrorDetails(invalidPresetLog);
    }
  } else {
    logError('Running Renovate failed for an unknown reason');
  }
}
