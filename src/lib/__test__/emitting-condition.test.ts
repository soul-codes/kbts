import { kb, link } from "../index.js";
import { render } from "../markdown/renderer.js";

test("KB emitting condition", async () => {
  const sub = kb("Sub")`sub`;
  expect(await render([kb("Main")`${link(sub)} ${link(sub)}`])).toMatchSnapshot(
    "two linked, none embedded"
  );

  expect(
    await render([kb("Main")`${link(sub)} ${sub.forceEmbed()}`])
  ).toMatchSnapshot("one link, one embedded");

  expect(
    await render([kb("Main")`${sub.forceEmbed()} ${sub.forceEmbed()}`])
  ).toMatchSnapshot("both embedded");

  const sub2 = kb("Sub", { emitCondition: true })`sub`;
  expect(
    await render([kb("Main")`${sub2.forceEmbed()} ${sub2.forceEmbed()}`])
  ).toMatchSnapshot("both embedded, force emitted");
});

test("default emitting condition", async () => {
  const sub = kb("Sub")`sub`;
  expect(
    await render([kb("Main")`${sub}`], { defaultEmbedCondition: false })
  ).toMatchSnapshot("never embed");

  expect(
    await render([kb("Main")`${sub}`], { defaultEmbedCondition: true })
  ).toMatchSnapshot("always embed");
});
