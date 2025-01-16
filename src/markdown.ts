/**
 * @description This file used @cparras/apexdocs to generate markdown files from the Apex classes.
 * @author Oliver Pechey
 */
import { process as apexdocsProcess } from '@cparra/apexdocs';
import * as fs from 'fs';

/**
 * @description: Checks to see if the force-app directory exists and exits out if not.
 */
const checkForceAppExists = (): void => {
  if (!fs.existsSync('force-app')) {
    console.error('force-app directory not found. Exiting...');
    process.exit(1);
  }
};

/**
 * @description: Runs the ApexDocs process to generate markdown files.
 * @return {Promise<void>} - A promise that resolves when the process is complete
 */
export async function generateMarkdown(): Promise<void> {
  checkForceAppExists();
  try {
    await apexdocsProcess({
      defaultGroupName: 'Apex Classes',
      customObjectsGroupName: 'Objects',
      includeMetadata: true,
      scope: ['global', 'public', 'namespaceaccessible'],
      sourceDir: 'force-app',
      targetDir: 'docs',
      targetGenerator: 'markdown',
    });
  } catch (error) {
    console.error(`Unable to generate Markdown due to error: ${error}`);
    process.exit(1);
  }
}
