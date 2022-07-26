import { logError } from './github.js';

/**
 * @param {string} envName name of value from `process.env`
 * @param {boolean} [required]
 * @returns the value
 */
export function getEnv(envName, required) {
  const env = process.env[envName];
  if (required && !env) {
    logError(`process.env.${envName} is missing`);
    process.exit(1);
  }
  if (env && env.startsWith('$(')) {
    logError(`process.env.${envName} was set to an invalid variable name: ${env}`);
    process.exit(1);
  }
  return env;
}
