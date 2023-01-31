import { kb } from "kbts";
import { preferredFilename, render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(await render([preferredFilename("README")(readme)]));
