# renovate-config

Shared Renovate presets.

Useful links:

- All configuration options: https://docs.renovatebot.com/configuration-options/
- Built-in presets (see also other pages in the same section): https://docs.renovatebot.com/presets-default/
- Preset definitions: https://github.com/renovatebot/renovate/tree/main/lib/config/presets/internal

## Available presets

Presets should be referenced as `github>ecraig12345/renovate-config:presetNameGoesHere`.

<!-- below this comment is updated by scripts/updateReadme.js -->

<!-- start auto section -->

### `beachballLibrary`

Dependency management strategy for library repos, including Beachball change file generation

```jsonc
{
  // Generate change files after upgrade
  "postUpgradeTasks": {
    "commands": [
      "git add --all",
      "npx beachball change --no-commit --type patch --message '{{{commitMessage}}}'",
      // After server config change:
      // "npx beachball change --no-fetch --no-commit --type patch --message '{{{commitMessage}}}'",
      "git reset"
    ],
    "fileFilters": ["**/*"],
    "executionMode": "branch"
  },

  // By default (see overrides for dev and peer deps later), replace the semver range
  // with a newer one if the new version falls outside it, and update nothing otherwise
  // https://docs.renovatebot.com/configuration-options/#rangestrategy
  "rangeStrategy": "replace",

  // Config and overrides for pinning
  // https://docs.renovatebot.com/configuration-options/#pin
  "pin": {
    // Pinning is only used for devDependencies, so make the commit message more specific
    "commitMessageTopic": "devDependencies"
  },

  "packageRules": [
    // Overrides for changes only affecting devDependencies
    {
      "matchDepTypes": ["devDependencies"],
      // Make it clear in the commit message and PR title that this only affects dev deps
      "commitMessageTopic": "devDependency {{depName}}",
      // Pin devDependencies
      "rangeStrategy": "pin"
    },

    // Overrides for changes only affecting peerDependencies
    {
      "matchDepTypes": ["peerDependencies"],
      // Widen the range with newer one, e.g. ^1.0.0 -> ^1.0.0 || ^2.0.0
      "rangeStrategy": "widen"
    }
  ]
}
```

### `default`

```jsonc
{
  "extends": [
    // Ignore node_modules and anything under common test/fixture directory names
    ":ignoreModulesAndTests",
    // During the Renovate pipeline run, rebase any existing Renovate PRs if the base
    // branch has been updated
    ":rebaseStalePrs",
    // Group known monorepo packages together
    "group:monorepos",
    // Other known groupings (mostly not relevant for node) https://docs.renovatebot.com/presets-group/#grouprecommended
    "group:recommended",
    // Workarounds for known problems with packages https://docs.renovatebot.com/presets-workarounds/#workaroundsall
    "workarounds:all",
    // Make a PR when a vulnerability alert is detected (GitHub only)
    ":enableVulnerabilityAlerts",

    // Local presets
    "github>ecraig12345/renovate-config:newConfigWarningIssue"
  ],

  // Print final config for debugging
  "printConfig": true
}
```

### `dependencyDashboardMajor`

Require dependency dashboard approval for major upgrades

```jsonc
{
  "dependencyDashboard": true,
  "major": {
    "dependencyDashboardApproval": true
  }
}
```

### `groupEslint`

```jsonc
{
  // https://docs.renovatebot.com/configuration-options/#packagerules
  "packageRules": [
    {
      "groupName": "eslint packages",
      "matchPackagePatterns": ["eslint"],
      // don't group pinning updates
      "matchUpdateTypes": ["major", "minor", "patch", "rollback", "bump"]
    }
  ]
}
```

### `groupFluent`

```jsonc
{
  // https://docs.renovatebot.com/configuration-options/#packagerules
  "packageRules": [
    {
      "groupName": "Fluent UI packages",
      "matchPackagePrefixes": ["@fluentui/"],
      // don't group pinning updates
      "matchUpdateTypes": ["major", "minor", "patch", "rollback", "bump"]
      // would be good to dedupe after updates, but this may not be safe in all repos
      // "postUpdateOptions": ["npmDedupe", "yarnDedupeFewest"]
    }
  ]
}
```

### `groupJest`

```jsonc
{
  // https://docs.renovatebot.com/configuration-options/#packagerules
  "packageRules": [
    {
      "groupName": "jest packages",
      "matchPackagePrefixes": ["@jest/", "@types/jest"],
      "matchPackageNames": ["jest", "ts-jest"],
      // don't group pinning updates
      "matchUpdateTypes": ["major", "minor", "patch", "rollback", "bump"]
    }
  ]
}
```

### `groupRollup`

```jsonc
{
  // https://docs.renovatebot.com/configuration-options/#packagerules
  "packageRules": [
    {
      "groupName": "rollup packages",
      "matchPackagePrefixes": ["@rollup"],
      "matchPackagePatterns": ["^rollup"],
      // don't group pinning updates
      "matchUpdateTypes": ["major", "minor", "patch", "rollback", "bump"]
    }
  ]
}
```

### `groupTypescript`

```jsonc
{
  // https://docs.renovatebot.com/configuration-options/#packagerules
  "packageRules": [
    {
      // sometimes typescript and tslib updates are tightly coupled
      "groupName": "typescript packages",
      "matchPackageNames": ["typescript", "tslib"],
      // don't group pinning updates
      "matchUpdateTypes": ["major", "minor", "patch", "rollback", "bump"]
    }
  ]
}
```

### `libraryRecommended`

Recommended config for a library repo or monorepo

```jsonc
{
  "extends": [
    "github>ecraig12345/renovate-config",
    "github>ecraig12345/renovate-config:dependencyDashboardMajor",
    "github>ecraig12345/renovate-config:beachballLibrary",
    ":maintainLockFilesWeekly"
  ]
}
```

### `newConfigWarningIssue`

Always create a new issue if there's a config problem (for visibility)

```jsonc
{
  "configWarningReuseIssue": false
}
```
