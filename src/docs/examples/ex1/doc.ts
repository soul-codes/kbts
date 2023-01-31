import { api, code, d, kb, link, remark } from "kbts";
import { render, save } from "kbts/markdown";
import { loadExample } from "../loadExample.js";

export const firstKB = kb("Rendering a simple KB as markdown")(async () => {
  const example = await loadExample("ex1");
  return d`
A KB is a document with a title and a content. This example creates a KB with
a simple text content

${example.code}

In order to generate a documentation, a set of KBs must be sent to a renderer.
Here we use the markdown renderer.

${remark()`
  We use a top-level ${code("await")} as ${link(api(save))}
  and ${link(api(render))} both return a promise.
  You'll need Node >= 14.8 for this.
`}

Result:
${example.result("my_documentation")}
`;
});
