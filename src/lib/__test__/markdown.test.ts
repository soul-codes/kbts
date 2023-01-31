import { code, kb } from "../index.js";
import { render } from "../markdown/renderer.js";

test("ok", async () => {
  const md = (await render([kb("test")`This is a ${code("code")}.`]))[0].text;
  expect(md).toMatchSnapshot();
});
