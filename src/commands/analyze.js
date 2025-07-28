import DependencyAnalysisService from '../libs/services/dependency-analysis.js';
import { Logger } from '../libs/utils/logger.js';

export async function analyzeDependencies(packageJson, options = {}) {
  if (!packageJson || typeof packageJson !== 'object') {
    throw new Error('Package.json data is required for dependency analysis');
  }

  const analysisService = new DependencyAnalysisService({
    maxConcurrent: options.maxConcurrent || 5,
    timeout: options.timeout || 15000,
  });

  try {
    const analysisResult = await analysisService.analyzeDependencies(packageJson);

    displayAnalysisResults(analysisResult);

    return analysisResult;
  } catch (error) {
    Logger.error('Dependency analysis failed:', error.message);
    throw error;
  }
}

function displayAnalysisResults(result) {
  const { dependencies, summary } = result;

  Logger.newLine();
  Logger.section('📊 DEPENDENCY ANALYSIS RESULTS');

  displaySummaryStats(summary);

  const grouped = groupDependenciesByStatus(dependencies);

  if (grouped && grouped.outdated && grouped.outdated.length > 0) {
    displayOutdatedDependencies(grouped.outdated);
  }

  const deprecated = dependencies.filter((dep) => dep.deprecated);
  if (deprecated.length > 0) {
    displayDeprecatedDependencies(deprecated);
  }

  const highImpact = dependencies.filter((dep) => dep.impact === 'high');
  if (highImpact.length > 0) {
    displayHighImpactDependencies(highImpact);
  }

  if (summary.errors > 0) {
    displayErrorSummary(grouped.error);
  }

  if (result.cacheStats) {
    displayPerformanceMetrics(summary.performance, result.cacheStats);
  }
}

function displaySummaryStats(summary) {
  Logger.keyValue('Total Dependencies', summary.total.toString());
  Logger.keyValue('Successfully Analyzed', `${summary.analyzed}/${summary.total}`);
  Logger.keyValue('Up to Date', summary.upToDate.toString());
  Logger.keyValue('Outdated', summary.outdated.toString());

  if (summary.errors > 0) {
    Logger.keyValue('Errors', summary.errors.toString());
  }

  Logger.newLine();
  Logger.section('Impact Levels:');
  Logger.listItem(`🔴 High Impact: ${summary.impactLevels.high}`);
  Logger.listItem(`🟡 Medium Impact: ${summary.impactLevels.medium}`);
  Logger.listItem(`🟢 Low Impact: ${summary.impactLevels.low}`);
  Logger.newLine();

  Logger.section('Security Risk Assessment:');
  Logger.listItem(`⚠️  High Risk: ${summary.securityRisks.high}`);
  Logger.listItem(`⚡ Medium Risk: ${summary.securityRisks.medium}`);
  Logger.listItem(`✅ Low Risk: ${summary.securityRisks.low}`);
}

function groupDependenciesByStatus(dependencies) {
  return dependencies.reduce((groups, dep) => {
    const status = dep.status || 'unknown';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(dep);
    return groups;
  }, {});
}

function displayOutdatedDependencies(outdated) {
  Logger.newLine();
  Logger.section('🔄 OUTDATED DEPENDENCIES');

  outdated.forEach((dep) => {
    const impact = getImpactEmoji(dep.impact);
    const type = dep.type === 'production' ? '🏭' : '🔧';

    Logger.listItem(
      `${impact} ${type} ${dep.name}: ${dep.currentVersion} → ${dep.latest} (${dep.updateType})`,
    );

    if (dep.description) {
      Logger.indent(`Description: ${dep.description.substring(0, 80)}...`);
    }
  });
}

function displayDeprecatedDependencies(deprecated) {
  Logger.newLine();
  Logger.section('⚠️  DEPRECATED DEPENDENCIES');

  deprecated.forEach((dep) => {
    Logger.listItem(`${dep.name}: ${dep.currentVersion}`, 'red');
    if (dep.deprecated) {
      Logger.listItem(`⚠️  ${dep.deprecated}`, 5);
    }
  });
}

/**
 * Display high-impact dependencies
 */
function displayHighImpactDependencies(highImpact) {
  Logger.newLine();
  Logger.section('🚨 HIGH IMPACT UPDATES');

  highImpact.forEach((dep) => {
    Logger.listItem(`${dep.name}: ${dep.currentVersion} → ${dep.latest}`, 5);
    Logger.listItem(`Update Type: ${dep.updateType}`);

    if (dep.repository) {
      Logger.listItem(`Repository: ${dep.repository}`);
    }
  });
}

function displayErrorSummary(errorDeps) {
  Logger.newLine();
  Logger.section('❌ ANALYSIS ERRORS');

  errorDeps.forEach((dep) => {
    Logger.listItem(`${dep.name}: ${dep.error}`, 5);
  });
}

function displayPerformanceMetrics(performance, cacheStats) {
  Logger.newLine();
  Logger.section('⚡ PERFORMANCE METRICS');
  Logger.keyValue('Success Rate', `${performance.successRate}%`);
  Logger.keyValue('Network Requests', performance.networkRequests.toString());
  Logger.keyValue('Cache Hits', cacheStats.cacheSize.toString());
  Logger.keyValue('Concurrent Requests', 'Optimized batching enabled');
}

function getImpactEmoji(impact) {
  switch (impact) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}
