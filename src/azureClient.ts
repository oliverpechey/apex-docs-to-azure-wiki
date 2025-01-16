/**
 * @description This file contains the Azure class, which is used to interact with the Azure DevOps API.
 * @author Oliver Pechey
 */
import axios, { AxiosResponse } from 'axios';
import { WikiPageCreateOrUpdateParameters } from 'azure-devops-node-api/interfaces/WikiInterfaces.js';
import { azureResponseCleanser } from './azureUtilities.js';
import { makeHeaders } from './azureSetup.js';

/**
 * @description: Class for interacting with the Azure DevOps API
 */
export class AzureClient {
  #baseUrl: string;
  #personalAccessToken: string;
  #wikiId: string;
  #archivedPages: string[] = []; // A list of pages already archived in this session so we don't try to archive them again

  /**
   * @description Constructor for the Azure class
   * @param {string} azureUrl - The Url to azure devops including the name of the organisation
   * @param {string} projectName - The name of the Azure DevOps project
   * @param {string} personalAccessToken - The personal access token for the Azure DevOps API
   * @param {string} wikiId - The ID of the wiki
   */
  constructor(
    azureUrl: string,
    projectName: string,
    personalAccessToken: string,
    wikiId: string,
  ) {
    this.#baseUrl = `${azureUrl}${projectName}/_apis`;
    this.#personalAccessToken = personalAccessToken;
    this.#wikiId = wikiId;
  }

  /**
   * @description Upserts a wiki page
   * @param {string} path - The path of the wiki page
   * @param {WikiPageCreateOrUpdateParameters} data - The data for the wiki page. This has one property, content,
   * which is the markdown content of the page
   * @param {string} eTag - The ETag of the page. If not provided, it will be fetched
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  public async upsertWikiPage(
    path: string,
    data: WikiPageCreateOrUpdateParameters,
  ): Promise<string> {
    console.log(`Upserting wiki page: ${path}`);

    // If we don't have an eTag, we need to get it, this is used to upsert the page
    const eTag = await this.getWikiPageETag(path);

    // We need to encode the path as it can contain special characters, usually spaces
    const encodedPath = encodeURIComponent(path);
    const url = `${this.#baseUrl}/wiki/wikis/${this.#wikiId}/pages?api-version=6.0&path=${encodedPath}`;

    try {
      // Make the api call
      await axios({
        method: 'PUT',
        url,
        headers: makeHeaders(this.#personalAccessToken, eTag), // We need to pass the eTag to update the page
        data,
      });

      // We return the path so we can keep a record of what pages we upserted
      return path;
    } catch (error) {
      console.error('Error upserting wiki page: ', error);
      process.exit(1);
    }
  }

  /**
   * @description Gets the ETag of a wiki page
   * @param {string} path - The path of the wiki page
   * @returns {Promise<string>} - A promise that resolves with the ETag of the page
   */
  async getWikiPageETag(path: string): Promise<string> {
    // We need to encode the path as it can contain special characters, usually spaces
    const encodedPath = encodeURIComponent(path);
    const url = `${this.#baseUrl}/wiki/wikis/${this.#wikiId}/pages?api-version=6.0&path=${encodedPath}`;

    try {
      // Make the api call
      const response = await axios({
        method: 'GET',
        url,
        headers: makeHeaders(this.#personalAccessToken),
      });

      return response.headers.etag;
    } catch (error) {
      // It will 404 if the page doesn't already exist
      if (error.response.status !== 404) {
        console.error('Error getting wiki page: ', error);
        process.exit(1);
      }
      // We don't return an etag. The absence of an etag will cause an insert
      return null;
    }
  }

  /**
   * @description Delete a wiki page
   * @param {string} path - The path of the wiki page
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  async deleteWikiPage(path: string): Promise<void> {
    // We need to encode the path as it can contain special characters, usually spaces
    const encodedPath = encodeURIComponent(path);
    const url = `${this.#baseUrl}/wiki/wikis/${this.#wikiId}/pages?api-version=6.0&path=${encodedPath}`;

    try {
      // Make the api call
      await axios({
        method: 'DELETE',
        url,
        headers: makeHeaders(this.#personalAccessToken),
      });
    } catch (error) {
      console.error('Error deleting wiki page: ', error);
      process.exit(1);
    }
  }

  /**
   * @description Gets all wiki pages
   * @param {string} path - The path of the wiki parent page
   * @returns {Promise<string[]>} - An array of all the wiki page paths
   */
  async getAllWikiPages(path: string): Promise<string[]> {
    console.log(`Getting all current wiki pages`);
    // We need to encode the path as it can contain special characters, usually spaces
    const encodedPath = encodeURIComponent(path);
    try {
      // Make the api call
      const response: AxiosResponse = await axios({
        method: 'GET',
        url: `${this.#baseUrl}/wiki/wikis/${this.#wikiId}/pages?api-version=6.0&path=${encodedPath}&recursionLevel=Full`,
        headers: makeHeaders(this.#personalAccessToken),
      });

      // If we don't get any data, something has gone horribly wrong
      if (!response.data) {
        throw new Error('No data returned from the API');
      }

      // Cleanse the data - This removes the Azure DevOps specific data and returns just the paths
      return azureResponseCleanser(response.data, path);
    } catch (error) {
      console.error('Error getting wiki pages: ', error);
      process.exit(1);
    }
  }

  /**
   * @description Archives a wiki page
   * @param {string} path - The path of the wiki page
   * @param {string} archivePath - The path to archive the page to
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  async archiveWikiPage(path: string, archivePath: string): Promise<void> {
    // The page may already be archived as the result of another operation (subpages) so we need to check
    const nonArchivedETag = await this.getWikiPageETag(path);
    if (!nonArchivedETag) {
      return;
    }

    // Create the parent pages for this path, otherwise the API will reject the request
    await this.createParentPages(archivePath);

    // Check if a page already exists in the archive
    const eTag = await this.getWikiPageETag(archivePath);
    if (eTag) {
      // If it does append a timestamp to the path
      archivePath = `${archivePath}-${Date.now()}`;
    }

    // Otherwise, move the page
    try {
      await axios({
        method: 'POST',
        url: `${this.#baseUrl}/wiki/wikis/${this.#wikiId}/pagemoves?api-version=6.0`,
        headers: makeHeaders(this.#personalAccessToken),
        data: {
          newPath: archivePath,
          path: path,
          newOrder: 0,
        },
      });
    } catch (error) {
      console.error('Error moving wiki page: ', error);
      process.exit(1);
    }
  }

  /**
   * @description Creates parent pages for a given path so that the API doesn't reject the request
   * @param {string} path - The path to create parent pages for
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  async createParentPages(path: string): Promise<void> {
    // We need to go through each sub-page and create it
    const parents = path.split('/').slice(0, -1);
    for (const [index] of parents.entries()) {
      // The path should include all parents up to the current index
      const parentPath = parents.slice(0, index + 1).join('/');

      // Make sure we havent already tried to move it, because the Azure API will reject it
      // Also grab an etag to check if the page already exists, since we don't want to overwrite it
      if (
        !this.#archivedPages.includes(parentPath) &&
        (await this.getWikiPageETag(parentPath)) === null
      ) {
        await this.upsertWikiPage(parentPath, {
          content:
            'This is a parent page. Please see sub-pages for more information.',
        });
        this.#archivedPages.push(parentPath);
      }
    }
  }
}
