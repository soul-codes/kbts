# kbts - a documentation-as-code library for TypeScript

`kbts` (for "Knowledge Base in TypeScript") presents a
documentation-as-code solution where units of documentation
("knowledge base" or "KB") are composed programmatically
to generate documentation. The approach in principle
allows for different presentations of KBs in various media
(markdown, CLI, interactive web page, etc); generally, `kbts`
encourages knowledge to be authored and linked independently of how it
is presented.

## Getting Started

### Rendering a simple KB as markdown

A KB is a document with a title and a content. This example creates a simple README
KB with a simple text content.

```ts
import { kb } from "kbts";
import { render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(render([readme]));
```

In order to generate a documentation, a set of KBs must be sent to a renderer.
Here we use the markdown renderer.

Result:


```md
# My Documentation

A nugget of wisdom goes here.
```


&#x20;  &#x20;

### Custom Output Naming

The markdown renderer emits one file per KB, named by its title.

```ts
import { kb } from "kbts";
import { defaultFilename, render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(render([defaultFilename("README")(readme)]));
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


&#x20;  &#x20;

### Links to other KBs

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

await save(render([pageA]));
```

This produces the following output:


```md
- Page_A.md
- Page_B.md
```

Examining `Page_A.md` gives:


```md
# Page A

See also [Page B](Page_B.md "Page B").
```

Examining `Page_B.md` gives:


```md
# Page B

See also [Page A](Page_A.md "Page A").
```

Importantly, note that in the code, only Page A was given to the
renderer, but Page B was also resolved and outputted. `kbts` will resolve
KB dependencies and emit all needed documents. You now have symbolic referential
guarantee for your documentation thanks to the knowledge base being
composed in TypeScript; no broken links!.
