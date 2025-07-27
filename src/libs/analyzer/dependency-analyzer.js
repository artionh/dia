import semver from 'semver';

/**
 * Analyze dependencies for available updates and impact.
 * @param {Object} dependencies - The dependencies object from package.json
 * @param {Object} latestVersions - An object mapping dependency names to their latest versions
 * @returns {Array} List of analysis results for each dependency
 */
export function analyzeDependencies(dependencies, latestVersions) {
  const results = [];
  for (const [name, currentVersion] of Object.entries(dependencies)) {
    const latest = latestVersions[name];
    if (!latest) {
      results.push({ name, currentVersion, latest: null, upToDate: true, impact: 'unknown' });
      continue;
    }
    const upToDate = semver.satisfies(latest, currentVersion);
    let impact = 'none';
    if (!upToDate) {
      if (semver.diff(currentVersion, latest) === 'major') {
        impact = 'high';
      } else if (semver.diff(currentVersion, latest) === 'minor') {
        impact = 'medium';
      } else {
        impact = 'low';
      }
    }
    results.push({ name, currentVersion, latest, upToDate, impact });
  }
  return results;
}

// Example usage (would be called from a command or CLI handler):
// const deps = { chalk: '^4.0.0', axios: '^0.21.0' };
// const latest = { chalk: '5.4.1', axios: '1.11.0' };
// const report = analyzeDependencies(deps, latest);
// console.log(report);
