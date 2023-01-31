import { KB, kb, link } from "kbts";
import { render, save } from "kbts/markdown";

export const pageA = kb("Page A")`
  See also ${() => link(pageB)}.
`;

export const pageB: KB = kb("Page B")`
  See also ${link(pageA)}.
`;

await save(await render([pageA]));
