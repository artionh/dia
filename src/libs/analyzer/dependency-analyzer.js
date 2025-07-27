import semver from 'semver';

export function analyzeDependencies(dependencies, latestVersions) {
  if (!dependencies || typeof dependencies !== 'object') {
    throw new Error('Dependencies must be a valid object');
  }

  if (!latestVersions || typeof latestVersions !== 'object') {
    throw new Error('Latest versions must be a valid object');
  }

  const results = [];

  for (const [name, currentVersion] of Object.entries(dependencies)) {
    if (!name || typeof name !== 'string') {
      continue;
    }

    if (!currentVersion || typeof currentVersion !== 'string') {
      results.push({
        name,
        currentVersion: currentVersion || 'unknown',
        latest: null,
        upToDate: false,
        impact: 'unknown',
        versionDiff: null,
      });
      continue;
    }

    const latest = latestVersions[name];

    if (!latest) {
      results.push({
        name,
        currentVersion,
        latest: null,
        upToDate: true,
        impact: 'unknown',
        versionDiff: null,
      });
      continue;
    }

    try {
      const cleanCurrent = semver.coerce(currentVersion);
      const cleanLatest = semver.coerce(latest);

      if (!cleanCurrent || !cleanLatest) {
        results.push({
          name,
          currentVersion,
          latest,
          upToDate: false,
          impact: 'unknown',
          versionDiff: null,
        });
        continue;
      }

      const upToDate = semver.satisfies(cleanLatest.version, currentVersion);
      const versionDiff = upToDate ? null : semver.diff(cleanCurrent.version, cleanLatest.version);

      let impact = 'none';
      if (!upToDate && versionDiff) {
        switch (versionDiff) {
          case 'major':
            impact = 'high';
            break;
          case 'minor':
            impact = 'medium';
            break;
          case 'patch':
            impact = 'low';
            break;
          default:
            impact = 'unknown';
        }
      }

      results.push({
        name,
        currentVersion,
        latest: cleanLatest.version,
        upToDate,
        impact,
        versionDiff,
      });
    } catch (error) {
      results.push({
        name,
        currentVersion,
        latest,
        upToDate: false,
        impact: 'unknown',
        versionDiff: null,
      });
    }
  }

  return results;
}

export function generateAnalysisSummary(analysisResults) {
  if (!Array.isArray(analysisResults)) {
    throw new Error('Analysis results must be an array');
  }

  const summary = {
    total: analysisResults.length,
    upToDate: 0,
    outdated: 0,
    unknown: 0,
    impactLevels: {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      unknown: 0,
    },
  };

  for (const result of analysisResults) {
    if (result.upToDate) {
      summary.upToDate++;
    } else if (result.impact === 'unknown') {
      summary.unknown++;
    } else {
      summary.outdated++;
    }

    summary.impactLevels[result.impact]++;
  }

  return summary;
}
