import path from 'path';
import fs from 'fs';
import { ERROR_CODES } from '../utils/error-codes.js';

const validateNpmProject = function (projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      isValid: false,
      errors: [ERROR_CODES.NPM_NO_PACKAGE_JSON],
    };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const hasDeps = packageJson.dependencies || packageJson.devDependencies;
    if (!hasDeps) {
      return {
        isValid: false,
        errors: [ERROR_CODES.NPM_NO_DEPENDENCIES],
      };
    }

    return {
      isValid: true,
      packageJson: packageJson,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`${ERROR_CODES.NPM_INVALID_PACKAGE_JSON}\n ${error.message}`],
    };
  }
};

export default validateNpmProject;
