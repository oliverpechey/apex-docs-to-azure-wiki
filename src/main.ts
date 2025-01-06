#!/usr/bin/env node
import { process as apexdocsProcess } from '@cparra/apexdocs';
import * as fs from 'fs';

/*
 * @description: Checks to see if the force-app directory exists and exits out if not.
 * @param: none
 * @return: none
 * @example: checkForceAppExists();
 */
const checkForceAppExists = (): void => {
  if (!fs.existsSync('force-app')) {
    console.error('force-app directory not found. Exiting...');
    process.exit(1);
  }
};

/*
  * @description: Runs the ApexDocs process to generate markdown files.
  * @param: none
  * @return: none
  * @example: await runApexDocs();
  */
async function runApexDocs(): Promise<void> {
  console.log('Exporting Apex classes to markdown...');
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
    console.log('Export complete!');
  }
  catch(error) {
    console.error(`Unable to generate Markdown due to error: ${error}`);
    process.exit(1);
  }
  
}

// This will be executed when "npx apex-to-azure" is executed.
checkForceAppExists();
await runApexDocs();
