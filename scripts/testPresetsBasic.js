import path from 'path';
import { logEndGroup, logError, logGroup } from './utils/github.js';
import { readPresets } from './utils/readPresets.js';
import { runBin } from './utils/runBin.js';

const presets = readPresets();

// Use renovate-config-validator to test for blatantly invalid configuration.
// But it DOES NOT test validity of preset names in the `extends` configuration.
for (const preset of Object.keys(presets)) {
  const presetName = path.basename(preset);
  logGroup(`Testing ${presetName}`);

  const result = runBin('renovate-config-validator', [], {
    env: { RENOVATE_CONFIG_FILE: preset },
  });

  if (result.status !== 0) {
    process.exitCode = 1;
    logError(`Error validating "${presetName}" (see logs above for details)`, presetName);
  }

  logEndGroup();
}
