import { writeFile } from "fs";
import { dirname, join, resolve } from "path";
import { promisify } from "util";

import type {
  BlockContent,
  Content,
  DefinitionContent,
  Heading,
  ListItem,
  Content as MarkdownNode,
  Paragraph,
  PhrasingContent,
  Root,
} from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import { mkdirp } from "mkdirp";

import {
  Block,
  Embed,
  EmbedCondition,
  Fragment,
  Inline,
  KB,
  Link,
  List,
  Node,
  NodeType,
  decodeBlockStyle,
  decodeInlineStyle,
} from "../index.js";
import { EmitCondition } from "../types.js";
import { explicitFilenames } from "./metadata.js";

type EmitResult = null | MarkdownNode | ParagraphFragment | ParagraphFragment;

type NestedArray<T> = T | readonly NestedArray<T>[];

interface ParagraphFragment {
  type: "paragraph_fragment";
  children: PhrasingContent[];
}

type EmitFunction = (context: EmitContext) => NestedArray<EmitResult>;

export interface RenderOptions {
  defaultEmbedCondition: EmbedCondition;
  defaultEmitCondition: EmitCondition;
  paths: Iterable<readonly [KB, string]>;
}

interface RenderInstance extends RenderContext {
  kb: KB;
  state: DocumentState;
  emit: EmitFunction;
  interface: ForeignDocument;
}

interface DocumentState {
  mutableFilename: string;
  isFilenameExplicit: boolean;
  refCount: number;
  embedRefs: Set<object>;
}

interface RenderContext {
  ensureLinkedDocument(
    target: KB,
    topLevel: boolean,
    embedKey: object | null
  ): ForeignDocument;
}

interface ForeignDocument {
  getUrl: () => string;
  resolveEmbedding(condition: EmbedCondition): boolean;
  emitContent: (context: EmitContext) => NestedArray<EmitResult>;
}

interface EmitContext {
  headerLevel: number;
  isBlock: boolean;
  isCodeText: boolean;
}

export function render(
  docs: readonly KB[],
  options?: Partial<RenderOptions>
): readonly OutputFile[] {
  const renderInstances = new Map<KB, RenderInstance>();

  const paths = new Map(options?.paths || []);
  const getPath = (kb: KB) => paths.get(kb) ?? ".";

  function ensureLinkedDocument(
    doc: KB,
    topLevel: boolean,
    embedKey: null | object
  ): ForeignDocument {
    let instance = renderInstances.get(doc);
    if (!instance) {
      const explicitFilename = explicitFilenames.get(doc);
      const [filename, isFilenameExplicit] =
        explicitFilename == null
          ? [safeFilename(doc), false]
          : [explicitFilename.replace(/\.md$/i, ""), true];

      const foreignDocument: ForeignDocument = {
        getUrl: () =>
          join(getPath(doc), newInstance.state.mutableFilename + ".md"),
        resolveEmbedding: (condition) =>
          resolveEmbedding(
            condition ??
              doc.embedCondition ??
              options?.defaultEmbedCondition ??
              false,
            newInstance.state
          ),
        emitContent: (emitContext) => newInstance.emit(emitContext),
      };

      const newInstance: RenderInstance = {
        kb: doc,
        ensureLinkedDocument,
        state: {
          refCount: 0,
          embedRefs: new Set(),
          mutableFilename: filename,
          isFilenameExplicit: isFilenameExplicit,
        },
        emit: () => {
          throw Error("not assigned");
        },
        interface: foreignDocument,
      };

      renderInstances.set(doc, newInstance);
      newInstance.emit = renderDocument(doc, newInstance);
      instance = newInstance;
    }
    if (!topLevel) instance.state.refCount++;

    const i = instance;
    return {
      ...i.interface,
      emitContent: (context) => {
        embedKey && i.state.embedRefs.add(embedKey);
        return i.interface.emitContent(context);
      },
    };
  }

  function safeFilename(doc: KB): string {
    const title = doc.title;
    const stem = title.replace(/[^\w]+/g, "_");
    return stem;
  }

  for (const doc of docs) {
    ensureLinkedDocument(doc, true, null);
  }

  const escapeName = createNameEscaper((index, stem) => stem + "_" + index);
  for (const context of renderInstances.values()) {
    if (context.state.isFilenameExplicit) {
      context.state.mutableFilename = escapeName(context.state.mutableFilename);
    }
  }
  for (const context of renderInstances.values()) {
    if (!context.state.isFilenameExplicit) {
      context.state.mutableFilename = escapeName(context.state.mutableFilename);
    }
  }

  const output: OutputFile[] = [];
  for (const context of renderInstances.values()) {
    const emitCondition =
      context.kb.emitCondition ?? options?.defaultEmitCondition ?? false;

    // Don't emit if the KB has been embedded and the emit condition is not
    // `true` (forced)
    if (!emitCondition && context.state.embedRefs.size > 0) {
      continue;
    }

    const ast: Root = {
      type: "root",
      children: iterateEmits(
        context.interface.emitContent({
          headerLevel: 1,
          isBlock: true,
          isCodeText: false,
        }),
        true
      ),
    };

    const text = toMarkdown(ast);
    output.push({
      filename: resolve(
        getPath(context.kb),
        context.state.mutableFilename + ".md"
      ),
      text,
    });
  }

  return output;
}

export async function save(
  result: readonly OutputFile[],
  rootDir: string = process.cwd()
) {
  for (const { filename, text } of result) {
    await mkdirp(dirname(resolve(rootDir, filename)));
    await promisify(writeFile)(resolve(rootDir, filename), text, "utf-8");
  }
}

function resolveEmbedding(
  condition: NonNullable<EmbedCondition>,
  state: DocumentState
): boolean {
  if (typeof condition === "boolean") return condition;
  if (condition.type === "no_series") {
    return false; // @todo
  }
  if (condition.type === "reference_count") {
    return state.refCount <= condition.maxReferenceCount;
  }
  absurd(condition);
}

export interface OutputFile {
  filename: string;
  text: string;
}

function renderDocument(node: KB, context: RenderContext): EmitFunction {
  const content = renderNode(node.content, context);
  return map(
    content,
    (content, emitContext) =>
      emitContext.isBlock
        ? [
            {
              type: "heading",
              depth: emitContext.headerLevel as Heading["depth"],
              children: [{ type: "text", value: node.title }],
            },
            content,
          ]
        : content,
    (emitContext) => ({
      ...emitContext,
      headerLevel: emitContext.headerLevel + 1,
    })
  );
}

function renderNode(node: Node, context: RenderContext): EmitFunction {
  if (typeof node === "string") {
    return renderText(node);
  } else if (typeof node === "number") {
    return renderText(String(node));
  } else if (node == null) {
    return () => null;
  } else {
    switch (node.type) {
      case NodeType.Lazy: {
        return renderNode(node.content(), context);
      }

      case NodeType.Fragment: {
        return renderFragment(node, context);
      }

      case NodeType.Link: {
        return renderLink(node, context);
      }

      case NodeType.Embed: {
        return renderEmbed(node, context);
      }

      case NodeType.List: {
        return renderList(node, context);
      }

      case NodeType.Block: {
        return renderBlock(node, context);
      }

      case NodeType.Inline: {
        return renderInline(node, context);
      }

      default:
        absurd(node);
    }
  }
}

function renderText(node: string): EmitFunction {
  return (emitContext) => {
    if (emitContext.isBlock) {
      if (emitContext.isCodeText) {
        return { type: "text", value: node };
      } else {
        return node
          .split(/(?:(?:\r?\n\s*){2,})/)
          .filter((text) => text)
          .map(
            (text, index, texts): EmitResult => ({
              type: index === 0 ? "paragraph_fragment" : "paragraph",
              children: [{ type: "text", value: text }],
            })
          );
      }
    } else {
      return { type: "text", value: node.replace(/\r?\n\s*/g, " ") };
    }
  };
}

function renderFragment(node: Fragment, context: RenderContext): EmitFunction {
  return seq(
    node.content.map((child) => renderNode(child, context)),
    (items) => items
  );
}

function renderEmbed(node: Embed, context: RenderContext): EmitFunction {
  const { resolveEmbedding, emitContent: contentIfEmbed } =
    context.ensureLinkedDocument(node.target, false, {});

  const contentIfLink = renderNode(
    node.contentIfLink((label) => ({
      type: NodeType.Link,
      target: node.target,
      label: label ?? null,
    })),
    context
  );

  return (emitContext) => {
    const shouldEmbed: boolean =
      emitContext.isBlock && resolveEmbedding(node.condition);
    return (shouldEmbed ? contentIfEmbed : contentIfLink)(emitContext);
  };
}

function renderLink(node: Link, context: RenderContext): EmitFunction {
  const [labelFallback, url] =
    typeof node.target === "string"
      ? [node.target, node.target]
      : [
          node.target.title,
          context.ensureLinkedDocument(node.target, false, null).getUrl,
        ];

  const label = node.label ?? labelFallback;
  return (emitContext) => {
    return emitContext.isCodeText
      ? { type: "text", value: label }
      : {
          type: "link",
          url: typeof url === "function" ? url() : url,
          title: label,
          children: [{ type: "text", value: label }],
        };
  };
}

function renderList(node: List, renderContext: RenderContext): EmitFunction {
  return seq(
    node.items.map((item) => renderNode(item, renderContext)),
    (items, emitContext): NestedArray<EmitResult> => {
      return emitContext.isBlock
        ? emitContext.isCodeText
          ? // block code context
            items.map(
              (item): NestedArray<EmitResult> => [
                { type: "text", value: "- " },
                item,
              ]
            )
          : // block context
            {
              type: "list",
              children: items.map(
                (item): ListItem => ({
                  type: "listItem",
                  children: asBlockOrDefinitionContents(
                    iterateEmits(item, true)
                  ),
                })
              ),
            }
        : // inline context
          items.map((item, index) => [
            index === 0 ? null : { type: "text", value: ", " },
            item,
          ]);
    }
  );
}

function renderBlock(node: Block, context: RenderContext): EmitFunction {
  const style = decodeBlockStyle(node.style);
  const content = renderNode(node.content, context);
  return map(
    content,
    (children, emitContext) => {
      if (!style) return children;
      switch (style.class) {
        case "code": {
          return {
            type: "code",
            lang: style.language,
            value: getTextContent(children, true),
          };
        }

        case "quote": {
          return {
            type: "blockquote",
            children: asBlockOrDefinitionContents(iterateEmits(children, true)),
          };
        }

        default:
          absurd(style);
      }
    },
    (emitContext) =>
      style?.class === "code"
        ? { ...emitContext, isCodeText: true }
        : emitContext
  );
}

function renderInline(node: Inline, context: RenderContext): EmitFunction {
  const style = decodeInlineStyle(node.style);
  const content = renderNode(node.content, context);
  if (!style) return content;
  return map(
    content,
    (text) => {
      switch (style.class) {
        case "emphasis": {
          return {
            type: "strong",
            children: asPhrasingContents(iterateEmits(text, false)),
          };
        }

        case "strikethrough": {
          return {
            type: "delete",
            children: asPhrasingContents(iterateEmits(text, false)),
          };
        }

        case "code": {
          return { type: "inlineCode", value: getTextContent(text, true) };
        }

        default: {
          absurd(style.class);
        }
      }
    },
    (emitContext) => ({
      ...emitContext,
      isBlock: false,
      isCodeText: style.class === "code" ? true : emitContext.isCodeText,
    })
  );
}

function iterateEmits(emits: NestedArray<EmitResult>, block: boolean) {
  return [..._iterateEmits(emits, block)];
}

function* _iterateEmits(
  emits: NestedArray<EmitResult>,
  block: boolean,
  state: { lastPF: PhrasingContent[] | null } = { lastPF: null }
): Generator<Content> {
  if (Array.isArray(emits)) {
    for (const emit of emits) {
      yield* _iterateEmits(emit, block, state);
    }
  } else if (emits?.type === "paragraph_fragment") {
    if (state.lastPF) {
      state.lastPF.push(...emits.children);
    } else {
      state.lastPF = [...emits.children];
      yield { type: "paragraph", children: state.lastPF };
    }
  } else if (emits) {
    if (emits.type === "paragraph") {
      state.lastPF = emits.children;
    } else if (isBlockContent(emits)) {
      state.lastPF = null;
    }

    if (block && isPhrasingContent(emits)) {
      if (state.lastPF) {
        state.lastPF.push(emits);
      } else {
        state.lastPF = [emits];
        yield { type: "paragraph", children: state.lastPF };
      }
    } else {
      yield emits;
    }
  }
}

function map(
  emitFn: EmitFunction,
  constructor: (
    node: NestedArray<EmitResult>,
    context: EmitContext
  ) => NestedArray<EmitResult>,
  transformContext: (context: EmitContext) => EmitContext = identity
): EmitFunction {
  return (context) => constructor(emitFn(transformContext(context)), context);
}

function seq<T extends readonly EmitFunction[]>(
  defuseds: T,
  constructor: (
    nodes: { [key in keyof T]: NestedArray<EmitResult> },
    context: EmitContext
  ) => NestedArray<EmitResult>,
  transformContext: (context: EmitContext) => EmitContext = identity
): EmitFunction {
  return (context) => {
    const contentContext = transformContext(context);
    return constructor(
      defuseds.map((items) => items(contentContext)) as unknown as {
        [key in keyof T]: EmitResult;
      },
      context
    );
  };
}

function createNameEscaper(
  makeVariant: (index: number, stem: string) => string
) {
  const usedNames = new Set<string>();
  return function escapeName(name: string): string {
    if (usedNames.has(name)) {
      for (let i = 2; ; i++) {
        const variant = makeVariant(i, name);
        if (!usedNames.has(variant)) {
          name = variant;
          break;
        }
      }
    }
    usedNames.add(name);
    return name;
  };
}

function identity<T>(value: T) {
  return value;
}

function isPhrasingContent(content: Content): content is PhrasingContent {
  switch (content.type) {
    case "text":
    case "emphasis":
    case "strong":
    case "delete":
    case "html":
    case "inlineCode":
    case "break":
    case "image":
    case "imageReference":
    case "footnote":
    case "footnoteReference":
    case "link":
    case "linkReference": {
      return true;
    }
  }
  return false;
}

function isDefinitionContent(content: Content): content is DefinitionContent {
  switch (content.type) {
    case "definition":
    case "footnoteDefinition": {
      return true;
    }
  }
  return false;
}

function isBlockContent(content: Content): content is BlockContent {
  switch (content.type) {
    case "paragraph":
    case "heading":
    case "thematicBreak":
    case "blockquote":
    case "list":
    case "table":
    case "html":
    case "code": {
      return true;
    }
  }
  return false;
}

function asBlockOrDefinitionContents(
  contents: Iterable<Content>
): (BlockContent | DefinitionContent)[] {
  const result: (BlockContent | DefinitionContent)[] = [];
  let implicitBlock: Paragraph | null = null;
  const flushImplicitBlock = () => {
    if (implicitBlock) {
      result.push(implicitBlock);
      implicitBlock = null;
    }
  };

  for (const content of contents) {
    if (isBlockContent(content) || isDefinitionContent(content)) {
      flushImplicitBlock();
      result.push(content);
    } else if (isPhrasingContent(content)) {
      if (!implicitBlock) {
        implicitBlock = { type: "paragraph", children: [] };
      }
      implicitBlock.children.push(content);
    } else {
      // noop;
    }
  }
  flushImplicitBlock();
  return result;
}

function asPhrasingContents(contents: Iterable<Content>): PhrasingContent[] {
  const result: PhrasingContent[] = [];
  for (const content of contents) {
    if (isPhrasingContent(content)) {
      result.push(content);
    }
  }
  return result;
}

function getTextContent(content: NestedArray<EmitResult>, block: boolean) {
  return toString(iterateEmits(content, block));
}

function absurd(_: never): never {
  throw Error();
}
