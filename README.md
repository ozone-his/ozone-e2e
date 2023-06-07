# Ozone Pro E2E Tests

[![Ozone E2E Tests](actions/workflows/e2e.yml/badge.svg)](actions/workflows/e2e.yml)

Welcome to Ozone Pro test suite that uses [Playwright](https://playwright.dev)
framework. 

- [Setup Steps](#setup-steps)
  * [Step 1. Setup the project](#step-1-setup-the-project)
  * [Step 2. Run e2e tests](#step-2-run-the-smoke-tests)
- [Configurations](#configurations)
- [Project Structure](#project-structure)
- [Guide for writing the tests](#guide-for-writing-the-tests)
- [Github Action integration](#github-action-integration)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>(Table of contents generated with markdown-toc)</a></i></small>

## Setup Steps

### Step 1. Setup the project

Clone the project

```sh
git clone https://github.com/kdaud/ozone-e2e-tests
```
Navigate into the project

```sh
cd ozone-e2e-tests
```

Install dependencies
```sh
yarn install
```

### Step 2. Run e2e tests

```sh
npx playwright test
```
## Configurations

This is underdevelopement/WIP. At the moment, there exists a git-shared
`.env` file which can be used for configuring certain test attributes.

By default, the test suite will run against the Ozone demo server.
You can override this by changing the `E2E_BASE_URL` environment variables beforehand:

```sh
# Ex: Set the server URL here
export E2E_BASE_URL=https://demo.ozone-his.com
```

## Project Structure 
The project uses the Playwright test runner and,
generally, follows a very simple project structure:

```
e2e
|__ tests
|   ^ Contains test cases
|__ utils
|   ^ Contains utilities needed to setup and tear down 
|     tests as well as methods required by the tests to run
```

## Guide for writing the tests

When writing a new test case, you need to create a new spec in `./e2e/tests`

## Github Action integration
The e2e.yml workflow is made up of one job that is triggered by PRs, and on a push.
