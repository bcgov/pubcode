// eslint-disable-next-line import/prefer-default-export
export const env = { ...import.meta.env, ...(globalThis.window?.config ?? {}) };
