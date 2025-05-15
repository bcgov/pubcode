describe("Home page visit", () => {

  it("visit landing page", () => {
    cy.visit("/");
    cy.contains("BCGov Pubcode");
  });
});
