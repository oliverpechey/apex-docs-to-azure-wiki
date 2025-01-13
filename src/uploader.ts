/**
 * @description This file contains the Uploader class which is used to upload markdown to Azure DevOps.
 * @author Oliver Pechey
 */
import { WikiPageCreateOrUpdateParameters } from 'azure-devops-node-api/interfaces/WikiInterfaces.js';
import { AzureClient } from './azure.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @description The Uploader class is used to upload markdown files to Azure DevOps.
 */
export class Uploader {
  #docsFolder: string;
  #azure: AzureClient;

  /**
   * @description Constructor for the Uploader class
   * @param {string} docsFolder - The path to the folder containing the markdown files
   * @param {AzureClient} azure - The AzureClient instance used to interact with the Azure DevOps API
   */
  constructor(docsFolder: string, azure: AzureClient) {
    this.#docsFolder = docsFolder;
    this.#azure = azure;
  }

  /**
   * @description Starts the upload process
   * @param {string} directory - The directory to start the upload process from
   * @returns {Promise<void>} - A promise that resolves when the upload is complete
   */
  async start(directory: string = this.#docsFolder): Promise<void> {
    console.log(`Traversing ${directory}`);
    try {
      const files = await fs.promises.readdir(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);

        let data: WikiPageCreateOrUpdateParameters;

        // Read the file content if its not a directory otherwise set filler content
        if (!fs.statSync(filePath).isDirectory()) {
          data = {
            content: fs.readFileSync(filePath, 'utf8'),
          };
        } else {
          data = {
            content:
              'This is a parent page. Please see sub-pages for more information.',
          };
        }

        // We dont want the full path, just the relative path from the docs folder
        const relativePath = path
          .relative(this.#docsFolder, filePath)
          .replace(/\.[^/.]+$/, ''); // Remove file extension

        // Make the call to azure to upsert
        await this.#azure.upsertWikiPage(relativePath, data);

        if (fs.statSync(filePath).isDirectory()) {
          await this.start(filePath); // Recurse into subdirectories
        }
      }
    } catch (err) {
      console.error('Error uploading markdown: ', err);
      process.exit(1);
    }
  }
}
