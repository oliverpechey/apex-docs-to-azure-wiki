/**
 * @description This file contains the Azure class, which is used to interact with the Azure DevOps API.
 * @author Oliver Pechey
 */
import axios, { AxiosResponse } from 'axios';
import { WikiPageCreateOrUpdateParameters } from 'azure-devops-node-api/interfaces/WikiInterfaces.js';

/**
 * @description The headers object for the Azure DevOps API
 * @param {string} Accept - The Accept header for the API
 * @param {string} `Content-Type` - The Content-Type header for the API
 * @param {string} Authorization - The Authorization header for the API
 * @param {string} `X-TFS-FedAuthRedirect` - The X-TFS-FedAuthRedirect header for the API
 * @param {string} [`If-Match`] - The If-Match header for the API. This is only used when updating a page
 */
type Headers = {
  Accept: string;
  'Content-Type': string;
  Authorization: string;
  'X-TFS-FedAuthRedirect': string;
  'If-Match'?: string;
};

/**
 * @description: Class for interacting with the Azure DevOps API
 */
export class AzureClient {
  baseUrl: string;
  personalAccessToken: string;
  #wikiId: string;
  #pathPrefix: string;

  /**
   * @description Constructor for the Azure class
   * @param {string} orgName - The name of the Azure DevOps organization
   * @param {string} projectName - The name of the Azure DevOps project
   * @param {string} personalAccessToken - The personal access token for the Azure DevOps API
   * @param {string} wikiId - The ID of the wiki
   * @param {string} pathPrefix - The prefix for the wiki page paths
   */
  constructor(
    orgName: string,
    projectName: string,
    personalAccessToken: string,
    wikiId: string,
    pathPrefix: string,
  ) {
    this.baseUrl = this.#makeBaseApiUrl( orgName, projectName );
    this.personalAccessToken = personalAccessToken;
    this.#wikiId = wikiId;
    this.#pathPrefix = pathPrefix.endsWith('/') ? pathPrefix : `${pathPrefix}/`;
  }

  /**
   * @description Upserts a wiki page
   * @param {string} path - The path of the wiki page
   * @param {WikiPageCreateOrUpdateParameters} data - The data for the wiki page. This has one property, content, 
   * which is the markdown content of the page
   * @returns {Promise<void>} - A promise that resolves when the operation is complete
   */
  public async upsertWikiPage(
    path: string,
    data: WikiPageCreateOrUpdateParameters,
  ): Promise<void> {
    console.log(`Upserting wiki page: ${path}`);
    // Set the eTag if the page exists - this is used to update the page
    let eTag: string | undefined;
    try {
      const response: AxiosResponse = await this.#callApi(path);
      eTag = response.headers.etag;
    } catch (error) {
      if (error.response.status !== 404) {
        console.error('Error getting wiki page: ', error);
      }
    }

    // Upsert the page. If it exists, the eTag will be used to update it
    try {
      await this.#callApi(path, data, eTag);
    } catch (error) {
      console.error('Error upserting wiki page: ', error);
      process.exit(1);
    }
  }

  /**
   * @description Creates the base URL for the Azure DevOps API
   * @param {string} orgName - The URL of the Azure DevOps organization
   * @param {string} projectName - The name of the Azure DevOps project
   * @returns {string} - The base API URL
   * @example https://dev.azure.com/{organization}/{project}/_apis
   */
  #makeBaseApiUrl(orgName: string, projectName: string): string {
    return `https://dev.azure.com/${orgName}/${projectName}/_apis`;
  }

  /**
   * @description Makes the headers for the Azure DevOps API
   * @param {string} personalAccessToken - The personal access token for the Azure DevOps API
   * @param {string} [eTag] - The ETag of the wiki page
   * @returns {Headers} - The headers for the API
   */
  #makeHeaders = (personalAccessToken: string, eTag?: string): Headers => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`PAT:${personalAccessToken}`).toString('base64')}`,
      'X-TFS-FedAuthRedirect': 'Suppress',
    };

    if (eTag) {
      headers['If-Match'] = eTag;
    }

    return headers;
  };

  /**
   * @description Calls the Azure DevOps API.
   * @param {string} path - The path to the wiki page.
   * @param {WikiPageCreateOrUpdateParameters} [data] - The contents of the wiki page. This has one property, content, which is the markdown content of the page.
   * @param {string} [eTag] - The ETag of the wiki page.
   * @returns {Promise<AxiosResponse>} - The response from the API.
   */
  async #callApi(
    path: string,
    data?: WikiPageCreateOrUpdateParameters,
    eTag?: string,
  ): Promise<AxiosResponse> {
    // We need to encode the path as it can contain special characters, usually spaces
    const encodedPath = encodeURIComponent(this.#pathPrefix + path);
    const url = `${this.baseUrl}/wiki/wikis/${this.#wikiId}/pages?api-version=6.0&path=${encodedPath}`;

    // If data is provided, do a PUT request to update the page. If not, do a GET request to get the page
    if (data) {
      return await axios({
        method: 'PUT',
        url,
        headers: this.#makeHeaders(this.personalAccessToken, eTag), // We need to pass the eTag to update the page
        data,
      });
    } else {
      return await axios({
        method: 'GET',
        url,
        headers: this.#makeHeaders(this.personalAccessToken),
      });
    }
  }
}
