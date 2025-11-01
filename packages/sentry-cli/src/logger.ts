/**
 * Simple logger for Sentry CLI
 */

import chalk from "chalk";

export const logError = (msg: string, detail?: any) =>
  process.stderr.write(
    `${chalk.red("✗")} ${msg}${detail ? `\n  ${chalk.gray(detail instanceof Error ? detail.message : detail)}` : ""}\n`,
  );

export const logSuccess = (msg: string) =>
  process.stdout.write(`${chalk.green("✓")} ${msg}\n`);

export const logInfo = (msg: string, detail?: string) =>
  process.stdout.write(
    `${chalk.blue("ℹ")} ${msg}${detail ? `\n  ${chalk.gray(detail)}` : ""}\n`,
  );

export const logJSON = (data: any) =>
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
