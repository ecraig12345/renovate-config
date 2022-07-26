import { spawnSync } from 'child_process';
import path from 'path';
import { root } from './paths.js';

/**
 * Run a binary provided by a node module
 * @param {string} bin
 * @param {string[]} args
 * @param {import('child_process').SpawnSyncOptions} opts
 */
export function runBin(bin, args, opts) {
  const command = process.execPath;
  const finalArgs = [path.join(root, 'node_modules/.bin', bin), ...args];
  console.log(`Running: ${bin} ${args.join(' ')}`);
  console.log(`(resolved: ${command} ${finalArgs.join(' ')})`);
  opts.env && console.log(`(env: ${JSON.stringify(opts.env)} )`);
  return spawnSync(command, finalArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: true, // required for stdio to show up
    maxBuffer: 1024 * 1024 * 100,
    ...opts,
  });
}
