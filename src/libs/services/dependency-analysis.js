import NpmRegistryClient from './npm-registry.js';
import { Logger } from '../utils/logger.js';
import semver from 'semver';

class DependencyAnalysisService {
  constructor(options = {}) {
    this.npmClient = new NpmRegistryClient({
      maxConcurrent: options.maxConcurrent || 8,
      timeout: options.timeout || 15000,
      retryAttempts: options.retryAttempts || 2,
    });
  }

  async analyzeDependencies(packageJson) {
    if (!packageJson || typeof packageJson !== 'object') {
      throw new Error('Invalid package.json data provided');
    }

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    const allDependencies = { ...dependencies, ...devDependencies };
    const packageNames = Object.keys(allDependencies);

    if (packageNames.length === 0) {
      return {
        dependencies: [],
        summary: {
          total: 0,
          analyzed: 0,
          errors: 0,
          upToDate: 0,
          outdated: 0,
        },
      };
    }

    Logger.info(`Fetching registry data for ${packageNames.length} packages...`);

    try {
      const registryResults = await this.npmClient.fetchMultiplePackages(packageNames);

      const analyzedDependencies = this._analyzeDependencyData(
        allDependencies,
        registryResults.results,
        registryResults.errors,
        dependencies,
      );

      const summary = this._generateSummary(analyzedDependencies, registryResults);

      Logger.success(`Analysis complete: ${summary.analyzed}/${summary.total} packages analyzed`);

      if (summary.errors > 0) {
        Logger.warn(`${summary.errors} packages had errors during analysis`);
      }

      return {
        dependencies: analyzedDependencies,
        summary,
        cacheStats: this.npmClient.getCacheStats(),
      };
    } catch (error) {
      Logger.error('Failed to analyze dependencies:', error.message);
      throw error;
    }
  }

  _analyzeDependencyData(allDependencies, registryResults, registryErrors, prodDeps) {
    const analyzed = [];

    for (const [packageName, currentVersion] of Object.entries(allDependencies)) {
      const analysis = {
        name: packageName,
        currentVersion: this._cleanVersion(currentVersion),
        type: prodDeps[packageName] ? 'production' : 'development',
      };

      if (registryErrors[packageName]) {
        analysis.error = registryErrors[packageName].error;
        analysis.status = 'error';
        analyzed.push(analysis);
        continue;
      }

      const registryData = registryResults[packageName];
      if (registryData) {
        analysis.latest = registryData.latest;
        analysis.description = registryData.description;
        analysis.repository = registryData.repository;
        analysis.license = registryData.license;
        analysis.deprecated = registryData.deprecated;

        const versionComparison = this._compareVersions(
          analysis.currentVersion,
          registryData.latest,
        );

        analysis.status = versionComparison.status;
        analysis.updateType = versionComparison.updateType;
        analysis.impact = versionComparison.impact;
        analysis.securityRisk = this._assessSecurityRisk(versionComparison, registryData);
      } else {
        analysis.status = 'unknown';
        analysis.error = 'No registry data available';
      }

      analyzed.push(analysis);
    }

    return analyzed.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1, unknown: 0 };
      const aImpact = impactOrder[a.impact] || 0;
      const bImpact = impactOrder[b.impact] || 0;

      if (aImpact !== bImpact) {
        return bImpact - aImpact;
      }

      return a.name.localeCompare(b.name);
    });
  }

  _compareVersions(current, latest) {
    if (!current || !latest) {
      return { status: 'unknown', updateType: null, impact: 'unknown' };
    }

    try {
      const cleanCurrent = semver.coerce(current);
      const cleanLatest = semver.coerce(latest);

      if (!cleanCurrent || !cleanLatest) {
        return { status: 'unknown', updateType: null, impact: 'unknown' };
      }

      if (semver.eq(cleanCurrent, cleanLatest)) {
        return { status: 'up-to-date', updateType: null, impact: 'low' };
      }

      if (semver.lt(cleanCurrent, cleanLatest)) {
        const diff = semver.diff(cleanCurrent, cleanLatest);

        return {
          status: 'outdated',
          updateType: diff,
          impact: this._getImpactLevel(diff),
        };
      }

      return {
        status: 'ahead',
        updateType: 'custom',
        impact: 'medium',
      };
    } catch (error) {
      return { status: 'unknown', updateType: null, impact: 'unknown' };
    }
  }

  _getImpactLevel(versionDiff) {
    switch (versionDiff) {
      case 'major':
        return 'high';
      case 'minor':
        return 'medium';
      case 'patch':
        return 'low';
      default:
        return 'unknown';
    }
  }

  _assessSecurityRisk(versionComparison, registryData) {
    if (registryData.deprecated) {
      return 'high';
    }

    if (versionComparison.updateType === 'major' && versionComparison.status === 'outdated') {
      return 'medium';
    }

    return 'low';
  }

  _cleanVersion(version) {
    if (!version || typeof version !== 'string') {
      return version;
    }

    return version.replace(/^[\^~>=<]/, '').trim();
  }

  _generateSummary(analyzedDependencies, registryResults) {
    const total = analyzedDependencies.length;
    const errors = analyzedDependencies.filter((dep) => dep.status === 'error').length;
    const upToDate = analyzedDependencies.filter((dep) => dep.status === 'up-to-date').length;
    const outdated = analyzedDependencies.filter((dep) => dep.status === 'outdated').length;
    const unknown = analyzedDependencies.filter((dep) => dep.status === 'unknown').length;

    const impactLevels = {
      high: analyzedDependencies.filter((dep) => dep.impact === 'high').length,
      medium: analyzedDependencies.filter((dep) => dep.impact === 'medium').length,
      low: analyzedDependencies.filter((dep) => dep.impact === 'low').length,
    };

    const securityRisks = {
      high: analyzedDependencies.filter((dep) => dep.securityRisk === 'high').length,
      medium: analyzedDependencies.filter((dep) => dep.securityRisk === 'medium').length,
      low: analyzedDependencies.filter((dep) => dep.securityRisk === 'low').length,
    };

    return {
      total,
      analyzed: total - errors,
      errors,
      upToDate,
      outdated,
      unknown,
      impactLevels,
      securityRisks,
      performance: {
        cacheHits: registryResults.totalRequested - registryResults.totalFailed,
        networkRequests: registryResults.totalRequested,
        successRate: Math.round(
          (registryResults.totalSuccessful / registryResults.totalRequested) * 100,
        ),
      },
    };
  }

  clearCache() {
    this.npmClient.clearCache();
  }
}

export default DependencyAnalysisService;
