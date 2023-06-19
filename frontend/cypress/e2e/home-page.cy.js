describe("Home page visit", () => {

  it("visit landing page", () => {
    cy.visit("/");
    cy.contains("Welcome to BCGov Public Code tool");
  });
});
