#!/usr/bin/env node

/**
 * @description This is the main entry point for the application. It generates markdown files from the Apex classes and triggers the upload to Azure DevOps.
 * @example npx apex-to-azure
 * @author Oliver Pechey
 */
import { generateMarkdown } from './markdown.js';
import { AzureClient } from './azureClient.js';
import * as path from 'path';
import { Uploader } from './uploader.js';
import { Archiver } from './archiver.js';

// Extract the command line arguments
const args = process.argv.slice(2);
const orgUrl = args[0]; // e.g. https://dev.azure.com/exampleOrg/ or use $(System.TeamFoundationCollectionUri) in an azure pipeline
const token = args[1]; // Personal Access Token or use $(System.AccessToken) in an azure pipeline
const project = args[2]; // e.g. ExampleProject or use $(System.TeamProject) in an azure pipeline
const wikiId = args[3]; // Name of the wiki, usually the name of the project with ".wiki" appended
let pathPrefix = args[4]; // e.g. "Home/Org Information/Auto Documentation"
const archivePath = args[5]; // e.g. "Home/Archived Pages"

// Clean up the path prefix
if (pathPrefix) {
  pathPrefix = pathPrefix.endsWith('/') ? pathPrefix.slice(0, -1) : pathPrefix;
  pathPrefix = pathPrefix.startsWith('/') ? pathPrefix.slice(1) : pathPrefix;
}

// Generate the markdown files
console.log('Exporting Apex classes to markdown...');
await generateMarkdown();
console.log('Export complete!');

// As this should be run in the root of a dx project, we are expecting the docs folder to be in the root
const docsFolder = path.join(process.cwd(), 'docs');

// Generate the Azure client used to upload the markdown
const azure = new AzureClient(orgUrl, project, token, wikiId);

// Create the Traverser and start the upload
console.log('Uploading markdown to DevOps wiki');
const uploader = new Uploader(docsFolder, azure, pathPrefix);
const uploadedPages = await uploader.start();
console.log('Upload complete!');

// We will call the archiver here. it will move any pages that are not in the docs folder to an archive folder
if (!archivePath) {
  console.log('No archive path provided, skipping archiving');
  process.exit(0);
}
console.log('Archiving pages');
const archiver = new Archiver(azure, archivePath, uploadedPages, pathPrefix);
await archiver.start();
console.log('Archiving complete!');
