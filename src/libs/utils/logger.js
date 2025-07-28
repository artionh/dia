import chalk from 'chalk';

const { blue, red, green, cyan, yellow, white, gray } = chalk;

export class Logger {
  static error(message, error = null) {
    console.log(red(`❌ ${message}`));
    if (error && error.message) {
      console.log(red(`   ${error.message}`));
    }
  }

  static success(message) {
    console.log(green(`✅  ${message}`));
  }

  static info(message) {
    console.log(blue(`ℹ️  ${message}`));
  }

  static warn(message) {
    console.log(yellow(`⚠️  ${message}`));
  }

  static keyValue(key, value, indent = 3) {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${key}: ${white(value)}`);
  }

  static section(title) {
    console.log(cyan(`📋 ${title}:`));
  }

  static listItem(message, indent = 3) {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}• ${message}`);
  }

  static newLine() {
    console.log();
  }
}
