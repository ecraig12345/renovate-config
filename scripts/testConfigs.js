// @ts-check

import { spawnSync } from 'child_process';
import { readConfigs } from './readConfigs.js';

const isGithub = !!process.env.GITHUB_REPOSITORY;
if (!isGithub) {
  console.warn('\nLocal runs of this test may not properly validate config extension\n');
}

const configs = readConfigs();
for (const [config, { content }] of Object.entries(configs)) {
  console.log(`${isGithub ? '::group::' : ''}Testing ${config}`);
  console.log(content);

  const result = spawnSync('yarn', ['renovate-config-validator'], {
    env: { RENOVATE_CONFIG_FILE: config },
    stdio: 'inherit',
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.status !== 0) {
    process.exitCode = 1;
    console.error(
      isGithub ? `::error file=${config}::Invalid config file` : `Invalid config file: ${config}`
    );
  }
  console.log(isGithub ? '::endgroup::' : '');
}
