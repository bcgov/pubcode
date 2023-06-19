import cypress from 'cypress';

export default cypress.defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    experimentalStudio: true,
    experimentalWebKitSupport: true,
  },
});
