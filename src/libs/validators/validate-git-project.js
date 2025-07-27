import path from 'path';
import fs from 'fs';
import { ERROR_CODES } from '../utils/error-codes.js';

const validateGitProject = function (projectPath) {
  const gitPath = path.join(projectPath, '.git');

  if (!fs.existsSync(gitPath)) {
    return {
      isValid: false,
      errors: [ERROR_CODES.GIT_NO_DIR],
    };
  }

  try {
    const gitConfigPath = path.join(gitPath, 'config');
    if (!fs.existsSync(gitConfigPath)) {
      return {
        isValid: false,
        errors: [ERROR_CODES.GIT_NO_CONFIG],
      };
    }

    const headsPath = path.join(gitPath, 'refs', 'heads');
    if (!fs.existsSync(headsPath) || fs.readdirSync(headsPath).length === 0) {
      return {
        isValid: false,
        errors: [ERROR_CODES.GIT_NO_COMMITS],
      };
    }

    return {
      isValid: true,
      gitInfo: {
        hasGit: true,
        hasCommits: true,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`${ERROR_CODES.GIT_GENERIC_ERROR}\n ${error.message}`],
    };
  }
};

export default validateGitProject;
