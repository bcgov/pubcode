describe("New Form", () => {
  beforeEach(() => {
    cy.visit("/edit");
  });

  it("renders the form", () => {
    cy.contains("GitHub Public Code Yml Link");
    cy.get("#root_bcgovpubcode_url").should("exist").type("https://github.com/bcgov/public-code/blob/main/bcgovpubcode.yml");
    cy.get("#submit").should("exist").click();
    cy.get("#submit").should("exist").click();
    cy.get("#copy").should("exist");
    cy.get("#download").should("exist");
  });


  /*it("clicks on the New button and navigates to /form", () => {
    cy.get("#New").contains("New").click();
    cy.location("pathname").should("eq", "/form");
  });

  it("clicks on the Edit button and navigates to /edit-form", () => {
    cy.get("#Edit").contains("Edit").click();
    cy.location("pathname").should("eq", "/edit-form");
  });*/

  /*  it("clicks on the Edit button and navigates to /edit-form", () => {
      cy.get(".leftDrawer Button").contains("Edit").click();
      cy.location("pathname").should("eq", "/edit-form");
    });*/

  // Uncomment the following test if you want to test the disabled button scenario
  // it("verifies the disabled button", () => {
  //   cy.get(".leftDrawer Button").contains("Search").should("be.disabled");
  // });
});
