import path from 'path';
import fs from 'fs';

const validateNpmProject = function (projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      isValid: false,
      errors: ["No package.json found. This doesn't appear to be an npm project."],
    };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.name) {
      return {
        isValid: false,
        errors: ['package.json is missing required "name" field'],
      };
    }

    const hasDeps = packageJson.dependencies || packageJson.devDependencies;
    if (!hasDeps) {
      return {
        isValid: false,
        errors: ['No dependencies found in package.json. Nothing to analyze.'],
      };
    }

    return {
      isValid: true,
      packageJson: packageJson,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid package.json: ${error.message}`],
    };
  }
};

export default validateNpmProject;
