# preferredFilename

```ts
/**
 * Annotate a KB with a filename. This is a higher-order function that
 * returns a document-annotating function. The resulting document is
 * the same instance as the input, it is just decorated internally.
 *
 * @param filename
 * @returns
 */
function preferredFilename(filename: string): <T extends KB>(document: T) => T;

```
