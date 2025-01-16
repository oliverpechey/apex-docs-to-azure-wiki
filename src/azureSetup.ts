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
 * @description Makes the headers for the Azure DevOps API
 * @param {string} personalAccessToken - The personal access token for the Azure DevOps API
 * @param {string} [eTag] - The ETag of the wiki page
 * @returns {Headers} - The headers for the API
 */
export function makeHeaders(
  personalAccessToken: string,
  eTag?: string,
): Headers {
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
}
