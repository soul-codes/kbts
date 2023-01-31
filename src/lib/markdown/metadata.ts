import { KB } from "../index.js";

export const explicitFilenames = new WeakMap<KB, string>();

/**
 * Annotate a KB with a filename. This is a higher-order function that
 * returns a document-annotating function. The resulting document is
 * the same instance as the input, it is just decorated internally.
 *
 * @param filename
 * @returns
 */
export function preferredFilename(filename: string) {
  return <T extends KB>(document: T): T => {
    explicitFilenames.set(document, filename);
    return document;
  };
}
