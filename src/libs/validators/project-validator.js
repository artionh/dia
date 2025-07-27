import path from 'path';
import validateNpmProject from './validate-npm-project.js';
import validateGitProject from './validate-git-project.js';

class ProjectValidator {
  constructor(projectPath = process.cwd()) {
    this.projectPath = path.resolve(projectPath);
  }

  validate() {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      projectInfo: {},
    };

    const npmCheck = validateNpmProject(this.projectPath);
    if (!npmCheck.isValid) {
      results.isValid = false;
      results.errors.push(...npmCheck.errors);
    } else {
      results.projectInfo.packageJson = npmCheck.packageJson;
    }

    const gitCheck = validateGitProject(this.projectPath);
    if (!gitCheck.isValid) {
      results.isValid = false;
      results.errors.push(...gitCheck.errors);
    } else {
      results.projectInfo.git = gitCheck.gitInfo;
    }

    return results;
  }

  getProjectSummary() {
    const validation = this.validate();
    if (!validation.isValid) {
      return null;
    }

    const pkg = validation.projectInfo.packageJson;
    const depCount = Object.keys(pkg.dependencies || {}).length;
    const devDepCount = Object.keys(pkg.devDependencies || {}).length;

    return {
      name: pkg.name || 'Unknown',
      version: pkg.version || '0.0.0',
      dependencyCount: depCount,
      devDependencyCount: devDepCount,
      totalDependencies: depCount + devDepCount,
      projectPath: this.projectPath,
    };
  }
}

export default ProjectValidator;
