#!/usr/bin/env node

import { program } from 'commander';
import ProjectValidator from '../libs/validators/project-validator.js';
import { Logger } from '../libs/utils/logger.js';
import { CLI_MESSAGES, EXIT_CODES } from '../libs/utils/constants.js';

function handleAnalyze(projectPath) {
  Logger.info(CLI_MESSAGES.HEADER);
  Logger.newLine();

  try {
    const validator = new ProjectValidator(projectPath);
    const validation = validator.validate();

    if (!validation.isValid) {
      Logger.error(CLI_MESSAGES.VALIDATION_FAILED);
      Logger.newLine();
      validation.errors.forEach((error) => {
        Logger.listItem(error);
      });
      process.exit(EXIT_CODES.VALIDATION_ERROR);
    }

    const summary = validator.getProjectSummary();
    if (!summary) {
      Logger.error('Unable to generate project summary');
      process.exit(EXIT_CODES.UNEXPECTED_ERROR);
    }

    Logger.success(CLI_MESSAGES.VALIDATION_PASSED);
    Logger.newLine();
    Logger.section(CLI_MESSAGES.PROJECT_SUMMARY);
    Logger.keyValue('Name', summary.name);
    Logger.keyValue('Version', summary.version);
    Logger.keyValue('Path', summary.projectPath);
    Logger.keyValue('Dependencies', summary.dependencyCount.toString());
    Logger.keyValue('Dev Dependencies', summary.devDependencyCount.toString());
    Logger.keyValue('Total to analyze', summary.totalDependencies.toString());
    Logger.newLine();

    Logger.warn(CLI_MESSAGES.READY_TO_ANALYZE);
  } catch (error) {
    Logger.error(CLI_MESSAGES.UNEXPECTED_ERROR, error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

program
  .name('dep-impact-analyzer')
  .description('Analyze the impact of dependency updates')
  .version('1.0.0')
  .argument('[path]', 'project path to analyze', '.')
  .action(handleAnalyze);

program.parse();
