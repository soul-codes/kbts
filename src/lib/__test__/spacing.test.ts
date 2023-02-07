import { code, kb } from "../index.js";
import { render } from "../markdown/renderer.js";

test("ok", async () => {
  const md = (
    await render([
      kb("test")`




  This paragraph stands alone.




  ${code("This paragraph starts with code")}.

  This paragraph contains spacing with linebreak that leads in to
  ${code("code")} on the next line.

  This paragraph ends with ${code("code")}.

  This paragraph has ${code("code")} in the middle.

  And this paragraph stands alone.

  `,
    ])
  )[0].text;
  expect(md).toMatchSnapshot();
});
