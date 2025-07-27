#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ProjectValidator from '../libs/validators/project-validator.js';

const { blue, red, green, cyan, yellow, white } = chalk;

program
  .name('dep-impact-analyzer')
  .description('Analyze the impact of dependency updates')
  .version('1.0.0')
  .argument('[path]', 'project path to analyze', '.')
  .action((projectPath) => {
    console.log(blue('🔍 Dependency Impact Analyzer\n'));

    const validator = new ProjectValidator(projectPath);
    const validation = validator.validate();

    if (!validation.isValid) {
      console.log(red('❌ Project validation failed:\n'));
      validation.errors.forEach((error) => {
        console.log(red(`   • ${error}`));
      });
      process.exit(1);
    }

    // Show project summary
    const summary = validator.getProjectSummary();
    console.log(green('✅ Project validation passed!\n'));
    console.log(cyan('📋 Project Summary:'));
    console.log(`   Name: ${white(summary.name)}`);
    console.log(`   Version: ${white(summary.version)}`);
    console.log(`   Dependencies: ${white(summary.dependencyCount)}`);
    console.log(`   Dev Dependencies: ${white(summary.devDependencyCount)}`);
    console.log(`   Total to analyze: ${white(summary.totalDependencies)}\n`);

    console.log(yellow('🚀 Ready to analyze dependency updates!'));
    // This is where we'll add the actual analysis logic next
  });

program.parse();
