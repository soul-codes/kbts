# render

```ts
/**
 * Renders the set of KBs as markdown documents.
 *
 * @param docs
 * @param options
 * @returns A set of markdown filename and texts that can be saved using `save`.
 */
function render(
  docs: readonly KB[],
  options: Partial<RenderOptions> | undefined
): Promise<readonly OutputFile[]>;

```
