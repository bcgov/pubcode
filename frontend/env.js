export const env = { ...import.meta.env, ...(globalThis.window?.config ?? {}) };
