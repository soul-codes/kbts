import { code, d, kb, link } from "kbts";
import { pkgRef } from "../../pkgRef.js";
import { loadExample } from "../loadExample.js";

export const linkExample = kb("Links to other KBs")(async () => {
  const example = await loadExample("ex3");

  return d`
A KB can link to other KBs using the ${code(link.name)} function.
With the markdown renderer, this causes the resulting markdowns to
also be linked. For instance:

${example.code}

This produces the following output:
${example.fileTree}

Examining ${code(`page_a.md`)} gives:
${example.result("page_a")}

Examining ${code(`page_b.md`)} gives:
${example.result("page_b")}

Importantly, note that in the code, only Page A was given to the
renderer, but Page B was also resolved and outputted. ${pkgRef} will resolve
KB dependencies and emit all needed documents. You now have symbolic referential
guarantee for your documentation thanks to the knowledge base being
composed in TypeScript; no broken links!.

`;
});
