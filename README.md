# Apex Docs to Azure Wiki

[![TypeScript version][ts-badge]][typescript-5-7]
[![Node.js version][nodejs-badge]][nodejs]
[![APLv2][license-badge]][license]
[![Build Status - GitHub Actions][gha-badge]][gha-ci]

This npm package is intended to be used in an azure CI/CD pipeline. If run in a Salesforce DX project, it will use [cesarParra/apexdocs][apex-docs] to generate markdown on any Apex classes. It will then upload them to the specified Azure Wiki.

## Usage
`npm i -g apex-docs-to-azure-wiki`

`npx apex-to-azure <orgUrl> <token> <projectName> <wikiName> <pathPrefix> [archivePath]`

### Parameters

1. **orgURL** - e.g. `https://dev.azure.com/exampleOrg/` or use $(System.TeamFoundationCollectionUri) in an azure pipeline
2. **token** - Personal Access Token or use $(System.AccessToken) in an azure pipeline
3. **projectName** - e.g. `ExampleProject` or use $(System.TeamProject) in an azure pipeline
4. **wikiName** - e.g. `ExampleProject.wiki` - Name of the wiki, usually the name of the project with ".wiki" appended
5. **pathPrefix** - Where in the wiki structure you want the pages to be uploaded e.g. `"Home/Org Information/Auto Documentation"`
6. **archivePath** - Optional parameter - Where you want the pages of removed classes to be moved to e.g. `"Home/Archived Pages"`

## Generating flow documentation

This package doesn't generate flow documentation. However [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis) generates markdown files for Flows with mermaid diagrams. Since this package uploads the entire contents of the generated /docs folder when it runs, if you run `sf hardis:doc:project2markdown` beforehand, these will get uploaded too.

## Special thanks to

1. [cesarParra/apexdocs][apex-docs] - Without this fantastic package, I would have nothing to upload to an Azure Wiki.
2. [sfdx-hardis][hardis] - Whilst I did not use this package, I use it in my own Azure pipelines and find it to be a great tool.

[ts-badge]: https://img.shields.io/badge/TypeScript-5.7-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%2020.9-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v20.x/docs/api/
[gha-badge]: https://github.com/oliverpechey/apex-docs-to-azure-wiki/actions/workflows/nodejs.yml/badge.svg
[gha-ci]: https://github.com/oliverpechey/apex-docs-to-azure-wiki/actions/workflows/nodejs.yml
[typescript-5-7]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: https://github.com/oliverpechey/apex-docs-to-azure-wiki/blob/main/LICENSE
[apex-docs]: https://github.com/cesarParra/apexdocs
[hardis]: https://github.com/hardisgroupcom/sfdx-hardis