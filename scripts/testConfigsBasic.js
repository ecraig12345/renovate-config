import path from 'path';
import { logEndGroup, logError, logGroup } from './utils/github.js';
import { readConfigs } from './utils/readConfigs.js';
import { runBin } from './utils/runBin.js';

const configs = readConfigs();

// Use renovate-config-validator to test for blatantly invalid configuration.
// But it DOES NOT test validity of preset names in the `extends` configuration.
for (const config of Object.keys(configs)) {
  const configName = path.basename(config);
  logGroup(`Testing ${configName}`);

  // 'node',
  // [path.join(root, 'node_modules/.bin/renovate-config-validator')],

  const result = runBin('renovate-config-validator', [], {
    env: { RENOVATE_CONFIG_FILE: config },
  });

  if (result.status !== 0) {
    process.exitCode = 1;
    logError(`Error validating "${configName}" (see logs above for details)`, configName);
  }

  logEndGroup();
}
