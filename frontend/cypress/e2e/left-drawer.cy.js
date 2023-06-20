describe("LeftDrawer", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the drawer", () => {
    cy.get(".MuiDrawer-root").should("exist");
  });


  it("clicks on the New button and navigates to /form", () => {
    cy.get("#New").contains("New").click();
    cy.location("pathname").should("eq", "/form");
  });

  it("clicks on the Edit button and navigates to /edit-form", () => {
    cy.get("#Edit").contains("Edit").click();
    cy.location("pathname").should("eq", "/edit-form");
  });

  /*  it("clicks on the Edit button and navigates to /edit-form", () => {
      cy.get(".leftDrawer Button").contains("Edit").click();
      cy.location("pathname").should("eq", "/edit-form");
    });*/

  // Uncomment the following test if you want to test the disabled button scenario
  // it("verifies the disabled button", () => {
  //   cy.get(".leftDrawer Button").contains("Search").should("be.disabled");
  // });
});
