describe("New Form", () => {
  beforeEach(() => {
    cy.visit("/form");
  });

  it("renders the form", () => {
    cy.contains("JSON schema for bcgovpubcode.yml");
    cy.get("#root_product_information_ministry").click();
    cy.get("#menu-root_product_information_ministry").contains("li", "Agriculture and Food").click();
    cy.get("#menu-root_product_information_ministry").should("not.exist");
    cy.contains("Agriculture and Food").should("be.visible");
    cy.get("#root_product_information_program_area").should("exist").type("Water, Land and Resource Stewardship");
    cy.get("#root_product_information_product_acronym").should("exist").type("Water, Land and Resource Stewardship");
    cy.get("#root_product_information_product_name").should("exist").type("Water, Land and Resource Stewardship");
    cy.get("#root_product_information_product_description").should("exist").type("Water, Land and Resource Stewardship");
    cy.get("#root_data_management_roles_product_owner").should("exist").type("Test");
    cy.get("#root_data_management_roles_data_custodian").should("exist").type("Test");
    cy.get("#root_product_technology_information_hosting_platforms").click();
    cy.get("#menu-root_product_technology_information_hosting_platforms").contains("li", "Google-Cloud-Platform").click();
    cy.get("#menu-root_product_technology_information_hosting_platforms").should("not.exist");
    cy.contains("Google-Cloud-Platform").should("be.visible");
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
