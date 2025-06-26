<!--
🔒 UPSTREAM MANAGED - DO NOT MODIFY
⚙️ Standard instructions for GitHub Copilot (AI coding assistant)

Use this file by including it in VS Code settings (.vscode/settings.json):
```jsonc
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": ".github/copilot-upstream.md"
    }
  ]
}
```
-->

You are a coding assistant for BC Government projects. Follow these guidelines:

When writing code:
- Use 2 spaces for indentation in all files
- Write variables and functions in camelCase
- Keep functions small, focused, and testable
- Add error handling for all async operations
- Follow security guidelines in SECURITY.md
- Include JSDoc comments for functions and classes
- Write unit tests using AAA pattern (Arrange-Act-Assert)
- Preserve existing patterns in the codebase
- Use modern language features appropriately

For security and compliance:
- Never generate credentials or secrets
- Always validate user inputs
- Use parameterized queries for databases
- Follow BC Government compliance standards
- Add input validation on public endpoints
- Check for performance impacts
- Review generated code for security implications

When documenting:
- Keep JSDoc comments up to date
- Document complex logic clearly
- Preserve existing documentation structure
- Include usage examples for APIs
- Use consistent Markdown formatting

Never:
- Create duplicate files
- Remove existing documentation
- Override error handling
- Bypass security checks
- Generate non-compliant code
