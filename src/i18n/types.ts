/** Shared i18n types without pulling locale modules into the client graph. */
export type Translations = typeof import("./en").en;
