// @ts-check

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { readConfigs } from './readConfigs.js';

const defaultRepo = 'ecraig12345/renovate-config';
const root = path.resolve(__dirname, '..');
const isGithub = !!process.env.CI;
const configs = readConfigs();

/** @type {(err: string, file?: string) => void} */
const logError = (err, file) =>
  console.error(isGithub ? `::error${file ? ` file=${file}` : ''}::${err}` : err);
const logGroup = (name) => console.log(isGithub ? name : `::group::${name}`);
const logEndGroup = () => console.log(isGithub ? '::endgroup::' : '');

function getEnv(envName) {
  const env = process.env[envName];
  if (isGithub && !env) {
    logError(`process.env.${envName} is missing`);
    process.exit(1);
  }
  return env;
}

function runBasicConfigTest() {
  // Use renovate-config-validator to test for blatantly invalid configuration.
  // But it DOES NOT test validity of preset names in the `extends` configuration.
  for (const [config, { content }] of Object.entries(configs)) {
    const configName = path.basename(config);
    logGroup(`Testing ${configName}`);
    console.log(content);

    const result = spawnSync('yarn', ['renovate-config-validator'], {
      cwd: root,
      env: { RENOVATE_CONFIG_FILE: config },
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 10,
    });

    if (result.status !== 0) {
      process.exitCode = 1;
      logError(`Config file "${configName}" is invalid`, configName);
    }

    logEndGroup();
  }
}

function runFullRenovateTest(token) {
  logGroup('Running full Renovate test');

  // https://docs.renovatebot.com/self-hosted-configuration/
  const logFile = path.join(root, 'renovate.log');
  fs.writeFileSync(logFile, '');
  const selfHostedConfig = {
    repositories: [defaultRepo],
    hostRules: [{ abortOnError: true }],
    logFile,
    logFileLevel: 'info',
    token,
    // force an "extends" config with all the presets from this repo
    force: {
      extends: [Object.keys(configs).map((c) => `${defaultRepo}:${path.basename(c, '.json')}`)],
    },
  };
  // write the config file to default expected name
  const configPath = path.join(root, 'config.js');
  fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(selfHostedConfig, null, 2)}`);

  const result = spawnSync('yarn', ['renovate', '--dry-run'], {
    cwd: root,
    env: {
      LOG_FORMAT: 'json',
      LOG_LEVEL: 'info',
    },
    stdio: 'inherit',
    maxBuffer: 1024 * 1024 * 100,
  });

  if (result.status !== 0) {
    logError('Invalid Renovate config');
    console.log(fs.readFileSync(logFile, 'utf8'));
    process.exitCode = 1;
  }
  logEndGroup();
}

function runTests() {
  const ref = getEnv('GITHUB_REF');
  const repository = getEnv('GITHUB_REPOSITORY');
  const token = getEnv('TOKEN');

  runBasicConfigTest();

  if (isGithub && ref === 'refs/heads/main' && repository === defaultRepo) {
    runFullRenovateTest(token);
  } else {
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
  }
}

runTests();
