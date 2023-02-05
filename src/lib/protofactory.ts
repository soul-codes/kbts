import { Fragment, KB, Lazy, Node, NodeType } from "./types.js";

export function createFactory<T>(
  buildNode: (node: Node) => T
): TemplateInterface<T> {
  return Object.assign(function d(...args: TemplateOverloadArgs) {
    return buildNode(createFragment(args, true));
  } as TemplateFunction<T>);
}

export function lazy(factory: () => Node | Promise<Node>): Lazy {
  return {
    type: NodeType.Lazy,
    content: factory,
  };
}

function createFragment(
  args: TemplateOverloadArgs,
  sanitize: boolean
): Fragment | null {
  const [first] = args;
  let content: Node[] = [];
  if (Array.isArray(first) && "raw" in first && Array.isArray(first.raw)) {
    // template mode, must intercalate arguments
    const templateStringsArray = first;
    const sanitizedTemplateStrings = sanitize
      ? sanitizeTemplate(templateStringsArray)
      : templateStringsArray;
    if (sanitizedTemplateStrings == null) return null;

    for (let i = 0, length = sanitizedTemplateStrings.length; i < length; i++) {
      let text = sanitizedTemplateStrings[i] || "";
      if (i === 0) text = text.trimStart();
      if (i === sanitizedTemplateStrings.length - 1) text = text.trimEnd();
      text && content.push(text);

      // first interpolation is index 1 because the template strings are index 0
      pushInterpoable(content, args[i + 1] as TemplateInterpolable);
    }
  } else {
    // normal invocation, interpret arguments sequentially
    for (let i = 0, length = args.length; i < length; i++) {
      const arg = args[i];
      pushInterpoable(content, arg ?? null);
    }
  }

  return { type: NodeType.Fragment, content };
}

export type TemplateInterpolable =
  | Node
  | KB
  | (() => TemplateInterpolable | Promise<TemplateInterpolable>)
  | readonly TemplateInterpolable[]
  | Promise<TemplateInterpolable>;

export type TemplateFunction<T> = {
  (...args: TemplateInterpolable[]): T;

  /**
   * Creates a documentation node as
   */
  (
    template: TemplateStringsArray,
    ...interpolations: readonly TemplateInterpolable[]
  ): T;
};

export interface TemplateInterface<T> extends TemplateFunction<T> {}

type TemplateOverloadArgs = readonly [
  TemplateStringsArray | TemplateInterpolable | undefined,
  ...(readonly TemplateInterpolable[])
];

const fragment = createFactory((factory) => factory);

function pushInterpoable(
  content: Node[],
  interpolable: TemplateInterpolable
): void {
  if (interpolable == null) return;
  if (Array.isArray(interpolable)) {
    for (const item of interpolable) pushInterpoable(content, item);
  } else if (typeof interpolable === "function") {
    pushInterpoable(
      content,
      lazy(() => {
        const result = interpolable();
        return result instanceof Promise
          ? result.then(fragment)
          : fragment(result);
      })
    );
  } else if (interpolable instanceof Promise) {
    const result = interpolable.then(fragment);
    pushInterpoable(
      content,
      lazy(() => result)
    );
  } else if (
    typeof interpolable === "object" &&
    interpolable.type === NodeType.KB
  ) {
    content.push({
      type: NodeType.Embed,
      target: interpolable,
      condition: null,
      contentIfLink: (createLink) => createLink(),
    });
  } else {
    content.push(interpolable);
  }
}

function sanitizeTemplate(templateStringsArray: readonly string[]) {
  let indentation: number | null = null;
  const splitLines = templateStringsArray.map(
    (templateString, templateStringIndex) =>
      templateString.split(/\r?\n/g).map((line, lineIndex) => {
        // first line in a string will not contribute to indentation
        if (lineIndex === 0) return () => line;

        const nonWhitespaceMatch = /[^ ]/.exec(line);
        const indentationPosition = nonWhitespaceMatch
          ? nonWhitespaceMatch.index
          : lineIndex === templateString.length - 1 &&
            templateStringIndex < templateStringsArray.length - 1
          ? line.length
          : null;

        if (
          indentationPosition != null &&
          (indentation == null || indentation > indentationPosition)
        ) {
          indentation = indentationPosition;
        }
        return (indentation: number) => line.substr(indentation);
      })
  );

  if (indentation == null) {
    return templateStringsArray;
  }

  const nonNullIndentation: number = indentation;
  return splitLines.map((lines) =>
    lines.map((line) => line(nonNullIndentation)).join("\n")
  );
}
