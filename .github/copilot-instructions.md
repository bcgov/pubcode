<!--
✏️ PROJECT-SPECIFIC INSTRUCTIONS
📝 Customize this file for your project needs
-->

# Project Copilot Instructions

> For instructions see [copilot-upstream.md](./copilot-upstream.md)

## Project Configuration

**Do not modify `.github/copilot-upstream.md`, which is managed and updated upstream.  Instead edit this file for project-specific instructions.**

Use these technologies:
- Next.js 14 with TypeScript
- PostgreSQL for database
- Node.js >= 18.0.0
- OpenAPI for API design

Follow these conventions:
- API endpoints: kebab-case
- React components: PascalCase
- Database: Always use parameterized queries

Project-specific rules:
- Python: 4 spaces (override BC Gov standard)
- APIs: Additional validation for public endpoints
- Branches: feature/JIRA-123-description

Never:
- Create duplicate files
- Remove existing documentation
- Override error handling
- Bypass security checks
- Generate non-compliant code
- Modify or remove the UPSTREAM MANAGED header at the top of `.github/copilot-upstream.md`
