/**
 * @description This file contains any utility functions for the azureClient that don't fit in the main class.
 * @author Oliver Pechey
 */
import { WikiPage } from 'azure-devops-node-api/interfaces/WikiInterfaces.js';

/**
 * @description Cleanses the response from Azure DevOps to get a list of pages
 * @param {WikiPage | WikiPage[]} data - The data from Azure DevOps
 * @param {string} docsPath - The path to the docs folder
 * @returns {string[]} - An array of page paths
 */
export function azureResponseCleanser(
  data: WikiPage | WikiPage[],
  docsPath: string,
): string[] {
  const pages: string[] = [];

  // The responses come back with a slash in the front, so we need to match
  docsPath = docsPath.startsWith('/') ? docsPath : `/${docsPath}`;

  // The root page is not an array, so we need to make it one
  if (!Array.isArray(data)) {
    data = [data];
  }

  // Iterate over the pages
  for (const page of data) {
    // We don't want the root page in this list
    if (page.path !== docsPath) {
      // Take everything after the docsPath in the string - make it relative
      const path = page.path.split(docsPath)[1];
      pages.push(path);
    }
    // If the page has subpages, recurse into them
    if (page.subPages) {
      pages.push(...azureResponseCleanser(page.subPages, docsPath));
    }
  }
  return pages;
}
