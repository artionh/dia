import path from 'path';
import fs from 'fs';

const validateGitProject = function (projectPath) {
  const gitPath = path.join(projectPath, '.git');

  if (!fs.existsSync(gitPath)) {
    return {
      isValid: false,
      errors: ['No .git directory found. This project must be a git repository.'],
    };
  }

  try {
    const gitConfigPath = path.join(gitPath, 'config');
    if (!fs.existsSync(gitConfigPath)) {
      return {
        isValid: false,
        errors: ['Git repository appears to be corrupted (no config file found).'],
      };
    }

    const headsPath = path.join(gitPath, 'refs', 'heads');
    if (!fs.existsSync(headsPath) || fs.readdirSync(headsPath).length === 0) {
      return {
        isValid: false,
        errors: ['Git repository has no commits. Please make an initial commit first.'],
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
      errors: [`Error checking git repository: ${error.message}`],
    };
  }
};

export default validateGitProject;
