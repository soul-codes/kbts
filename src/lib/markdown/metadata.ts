import { KB } from "../index.js";

export const explicitFilenames = new WeakMap<KB, string>();

export const defaultFilename =
  (filename: string) =>
  (document: KB): KB => {
    explicitFilenames.set(document, filename);
    return document;
  };
