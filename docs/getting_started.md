# Getting Started

## Rendering a simple KB as markdown

A KB is a document with a title and a content. This example creates a KB with
a simple text content

```ts
import { kb } from "kbts";
import { render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(await render([readme]));
```

In order to generate a documentation, a set of KBs must be sent to a renderer.
Here we use the markdown renderer.

> ℹ️ We use a top-level `await` as [save](save.md "save")
> and [render](render.md "render") both return a promise.
> You'll need Node >= 14.8 for this.

Result:

```md
# My Documentation

A nugget of wisdom goes here.
```



## Custom Output Naming

By default, the markdown renderer emits one file per KB, with the filename
being derived from the title. You can customize the output by using [preferredFilename](preferred_filename.md "preferredFilename")

```ts
import { kb } from "kbts";
import { preferredFilename, render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(await render([preferredFilename("README")(readme)]));
```

This produces the following output:

```md
- README.md
```

Examining `README.md` gives:

```md
# My Documentation

A nugget of wisdom goes here.
```



## Links to other KBs

A KB can link to other KBs using the `link` function.
With the markdown renderer, this causes the resulting markdowns to
also be linked. For instance:

```ts
import { KB, kb, link } from "kbts";
import { render, save } from "kbts/markdown";

export const pageA = kb("Page A")`
  See also ${() => link(pageB)}.
`;

export const pageB: KB = kb("Page B")`
  See also ${link(pageA)}.
`;

await save(await render([pageA]));
```

This produces the following output:

```md
- page_a.md
- page_b.md
```

Examining `page_a.md` gives:

```md
# Page A

See also [Page B](page_b.md "Page B").
```

Examining `page_b.md` gives:

```md
# Page B

See also [Page A](page_a.md "Page A").
```

Importantly, note that in the code, only Page A was given to the
renderer, but Page B was also resolved and outputted. `kbts` will resolve
KB dependencies and emit all needed documents. You now have symbolic referential
guarantee for your documentation thanks to the knowledge base being
composed in TypeScript; no broken links!.
