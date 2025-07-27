export const ERROR_CODES = {
  GIT_NO_DIR: 'No .git directory found. This project must be a git repository.',
  GIT_NO_CONFIG: 'Git repository appears to be corrupted (no config file found).',
  GIT_NO_COMMITS: 'Git repository has no commits. Please make an initial commit first.',
  GIT_GENERIC_ERROR: 'An error occurred while checking the git repository.',
  NPM_NO_PACKAGE_JSON: 'No package.json file found. This project must be an npm project.',
  NPM_NO_DEPENDENCIES: 'No dependencies found in package.json. Nothing to analyze.',
  NPM_INVALID_PACKAGE_JSON: 'Invalid package.json file. Please check the syntax.',
};
