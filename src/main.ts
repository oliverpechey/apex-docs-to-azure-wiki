#!/usr/bin/env node

/**
 * @description This is the main entry point for the application. It generates markdown files from the Apex classes and triggers the upload to Azure DevOps.
 * @example npx apex-to-azure
 * @author Oliver Pechey
 */
import { generateMarkdown } from './markdown.js';
import { AzureClient } from './azure.js';
import * as path from 'path';
import { Uploader } from './uploader.js';

// Extract the command line arguments
const args = process.argv.slice(2);
const orgUrl = args[0];
const token = args[1];
const project = args[2];
const wikiId = args[3];
const pathPrefix = args[4];

// Generate the markdown files
await generateMarkdown();

// As this should be run in the root of a dx project, we are expecting the docs folder to be in the root
const docsFolder = path.join(process.cwd(), 'docs');

// Generate the Azure client used to upload the markdown
const azure = new AzureClient(orgUrl, project, token, wikiId, pathPrefix);

// Create the Traverser and start the upload
console.log('Uploading markdown to DevOps wiki');
const uploader = new Uploader(docsFolder, azure);
await uploader.start();
console.log('Upload complete!');