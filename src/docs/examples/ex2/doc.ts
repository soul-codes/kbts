import { api, code, d, kb, link } from "kbts";
import { preferredFilename } from "kbts/markdown";
import { loadExample } from "../loadExample.js";

export const customName = kb("Custom Output Naming")(async () => {
  const example = await loadExample("ex2");

  return d`
By default, the markdown renderer emits one file per KB, with the filename
being derived from the title. You can customize the output by using ${link(
    api(preferredFilename)
  )}

${example.code}

This produces the following output:
${example.fileTree}

Examining ${code(`README.md`)} gives:
${example.result("README")}

`;
});
