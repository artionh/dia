export const IMPACT_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  UNKNOWN: 'unknown',
};

export const VERSION_DIFF_TYPES = {
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
};

export const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  UNEXPECTED_ERROR: 2,
  INVALID_INPUT: 3,
};

export const CLI_MESSAGES = {
  HEADER: '🔍 Dependency Impact Analyzer',
  VALIDATION_PASSED: '✅ Project validation passed!',
  VALIDATION_FAILED: '❌ Project validation failed:',
  PROJECT_SUMMARY: '📋 Project Summary:',
  READY_TO_ANALYZE: '🚀 Ready to analyze dependency updates!',
  UNEXPECTED_ERROR: '❌ An unexpected error occurred:',
};
