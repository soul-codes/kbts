# api

> ⚠️ Warning: This feature is experimental, and its behavior and
> interface are unstable!



The declaration capturing function. This is a **pragma**/compiled time
function which will error out at run time. Instead, you need to use the
TypeScript plugin that lives in `kbts/api-transform` and an over-TypeScript tool
such as [ttypescript](https://www.npmjs.com/package/ttypescript "ttypescript")
to process these calls at compile time.



> 🔴 ATTENTION: Calling `api` at runtime without having its call processed
> by TypeScript plugin will throw an exception.





> 🔴 ATTENTION: `api` must be called directly or as an `import` alias.
> The TypeScript plugin will not recognize indirect calls in the sense of
> having `api` assigned to other variables.



`api` is designed to capture declaration and type information of
either the symbol fed as its first argument, or the type declaration of a
type symbol fed as its first type argument. Further arguments can be supplied
to customize the rest of the document.



```ts
 api: <T>(targetSymbol?: unknown, factory?: ((ref: Node) => Node) | undefined, settings?: Partial<KbSettings> | undefined) => KBInstance
```
