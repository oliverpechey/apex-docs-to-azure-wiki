/**
 * @description This file contains the Archiver class, which is used to archive pages that are no longer in the docs folder.
 * @author Oliver Pechey
 */
import { AzureClient } from './azureClient.js';
import * as path from 'path';

/**
 * @description The Archiver class is used to archive pages that are no longer in the docs folder.
 */
export class Archiver {
  #azure: AzureClient;
  #archivePath: string;
  #uploadedPages: string[];
  #pathPrefix: string;

  /**
   * @description Constructor for the Archiver class
   * @param {AzureClient} azure - The AzureClient instance used to interact with the Azure DevOps API
   * @param {string} archivePath - The path to the archive folder
   * @param {string[]} uploadedPages - An array of the pages that have been uploaded
   * @param {string} pathPrefix - The path prefix for the wiki
   */
  constructor(
    azure: AzureClient,
    archivePath: string,
    uploadedPages: string[],
    pathPrefix: string,
  ) {
    this.#azure = azure;
    this.#archivePath = archivePath;
    this.#uploadedPages = uploadedPages;
    this.#pathPrefix = pathPrefix;
  }

  /**
   * @description Starts the archiving process
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  async start(): Promise<void> {
    // Get the pages that are currently published in the wiki
    const currentWikiPages = await this.#azure.getAllWikiPages(
      this.#pathPrefix,
    );

    for (const page of currentWikiPages) {
      // Normalize the path and remove leading slashes
      const normalizedPage = this.normalizePath(page);

      // Check if the page was just uploaded
      const isUploaded = this.#uploadedPages.some(
        (uploadedPage) => this.normalizePath(uploadedPage) === normalizedPage,
      );

      // If it wasn't then it should be archived
      if (!isUploaded) {
        console.log(`Archiving page: ${normalizedPage}`);
        await this.#azure.archiveWikiPage(
          this.#pathPrefix + '/' + normalizedPage,
          this.#archivePath + '/' + normalizedPage,
        );
      }
    }
  }

  /**
   * @description Normalizes the path to strip leading/trailing slashes and convert backslashes to forward slashes
   * @param {string} page - The page path
   * @returns {string} - The normalized path
   */
  normalizePath(page: string): string {
    return path.posix.normalize(page).replace(/^\/+/, '').replace(/\\/g, '/');
  }
}
