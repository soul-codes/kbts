import { kb } from "kbts";
import { defaultFilename, render, save } from "kbts/markdown";

export const readme = kb("My Documentation")`
  A nugget of wisdom goes here.
`;

await save(render([defaultFilename("README")(readme)]));
