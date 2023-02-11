### Pub Code UI

This is the code for the PubPub pub code UI. It is a React app that is built with Vite and served by Caddy.

#### What the tool does

It helps achieve the users two goals:

1. To be able to produce a bcgovpubcode.yml file from scratch.
2. To be able to edit and update a bcgovpubcode.yml file.

#### How the tool works

It generates a form based on the bcgovpubcode.yml JSON schema. The user fills out the form and the tool generates a
bcgovpubcode.yml file. The user can then download the file and add it to their repository or copy to clipboard. This is
achieved using the React json schema form library. https://react-jsonschema-form.readthedocs.io/en/latest/

#### OpenShift Deployment
Each PR creates a sandboxed environment in OpenShift. The URL is available in the PR checks. The environment is deleted when the PR is closed. the workflows are available at .github/workflows

#### Local Development
##### Prerequisites
- Node.js 18

##### Steps
1. Clone the repository
2. Install dependencies (npm ci)
3. Run the app (npm run dev)


