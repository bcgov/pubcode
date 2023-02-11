# Pub Code UI

This UI is a React app built with Vite and served by Caddy.

## Goal

It helps users to:

1. Produce a bcgovpubcode.yml file from scratch
2. Edit exiting bcgovpubcode.yml files by web link

## Process

The user fills out a form, which generates a bcgovpubcode.yml file, which can be downloaded or copied/pasted to add their GitHub repository. It is validated using the [React json schema form library](https://react-jsonschema-form.readthedocs.io/en/latest/).

## OpenShift Deployment

Each [Pull Request workflow](.github/workflows/pr-open.yml) creates a sandboxed environment deployed in OpenShift. A temporary URL is provided as part of the PR's checks.  Environments are removed when their PRs are closed.

## Local Development

Prerequisites:
- Node.js 18

Steps:

1. Clone the repository
    ```bash
    git clone https://github.com/bcgov/public-code.git
    ```
    OR
    ```bash
    git clone git@github.com:bcgov/public-code.git
    ```
2. Install dependencies
    ```bash
    npm ci
    ```
3. Run the app
    ```bash
    npm run dev
    ```


