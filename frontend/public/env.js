// Runtime configuration loaded before the Vite bundle.
// In production, Caddy serves /env.js and overwrites this response.

window.config = window.config || {
  VITE_SCHEMA_BRANCH: "main",
  VITE_POWERBI_URL: "",
};
