/**
 * @description This file contains the Uploader class which is used to upload markdown to Azure DevOps.
 * @author Oliver Pechey
 */
import { WikiPageCreateOrUpdateParameters } from 'azure-devops-node-api/interfaces/WikiInterfaces.js';
import { AzureClient } from './azureClient.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @description The Uploader class is used to upload markdown files to Azure DevOps.
 */
export class Uploader {
  #docsFolder: string;
  #azure: AzureClient;
  #pathPrefix: string;

  /**
   * @description Constructor for the Uploader class
   * @param {string} docsFolder - The path to the folder containing the markdown files
   * @param {AzureClient} azure - The AzureClient instance used to interact with the Azure DevOps API
   */
  constructor(docsFolder: string, azure: AzureClient, pathPrefix: string) {
    this.#docsFolder = docsFolder;
    this.#azure = azure;
    this.#pathPrefix = pathPrefix;
  }

  /**
   * @description Starts the upload process
   * @param {string} directory - The directory to start the upload process from
   * @returns {Promise<string[]>} - A promise that resolves with an array of the uploaded pages
   */
  async start(directory: string = this.#docsFolder): Promise<string[]> {
    const uploadedPages: string[] = [];
    console.log(`Traversing ${directory}`);
    try {
      const files = await fs.promises.readdir(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        let data: WikiPageCreateOrUpdateParameters;

        // Read the file contents if its not a directory otherwise set filler content
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
        await this.#azure.upsertWikiPage(this.#pathPrefix + '/' + relativePath, data);
        uploadedPages.push(relativePath);

        if (fs.statSync(filePath).isDirectory()) {
          const uploadedSubPages = await this.start(filePath); // Recurse into subdirectories
          uploadedPages.push(...uploadedSubPages);
        }
      }
      return uploadedPages;
    } catch (err) {
      console.error('Error uploading markdown: ', err);
      process.exit(1);
    }
  }
}
