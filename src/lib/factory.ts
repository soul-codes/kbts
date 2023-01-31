import { fileURLToPath } from "url";

import { TemplateInterface, createFactory } from "./protofactory.js";
import {
  Block,
  Embed,
  EmbedCondition,
  EmitCondition,
  Inline,
  KB,
  KBDeclarationCorrelation,
  Link,
  LinkTarget,
  List,
  Node,
  NodeType,
  Series,
  SourceInfo,
} from "./types.js";

export function series(
  title: string,
  items: readonly KB[],
  options?: Partial<{
    index: Node;
    sequential: boolean;
  }>
): Series {
  return {
    title,
    items,
    index: options?.index ?? null,
    sequential: options?.sequential ?? false,
  };
}

export interface KbSettings {
  embedCondition: EmbedCondition;
  emitCondition: EmitCondition;
}

export function kb(title: string, settings?: Partial<KbSettings>): KBAnchor {
  let declaration: KBDeclarationCorrelation | null = null;
  const anchor: KBAnchor = Object.assign(
    createFactory<KBInstance>((content) => {
      const kb: KBInstance = {
        type: NodeType.KB,
        title,
        content,
        embedCondition: settings?.embedCondition ?? null,
        emitCondition: settings?.emitCondition ?? null,
        declaration,
        embed: (link, condition) => ({
          type: NodeType.Embed,
          target: kb,
          contentIfLink: link,
          condition,
        }),
        forceEmbed: () => ({
          type: NodeType.Embed,
          target: kb,
          contentIfLink: (link) => link(),
          condition: true,
        }),
      };
      return kb;
    }),
    {
      definition: <T extends {}, K extends string>(
        value: T,
        key: K = "kb" as K
      ) => {
        const source = callSite(1);
        if (source) {
          declaration = {
            offset: 0,
            source,
          };
        }
        return Object.assign(value, { [key]: anchor(null) }) as T & {
          [key in K]: KBInstance;
        };
      },
      describesDeclarationAbove: (offset: number = 0) => {
        const source = callSite(1);
        if (source) {
          declaration = {
            offset,
            source,
          };
        }
        return anchor(null);
      },
    }
  );
  return anchor;
}

export interface KBAnchor extends TemplateInterface<KBInstance> {
  /**
   * Uses to create
   * @param value
   * @param key
   */
  definition<T extends {}, K extends string = "kb">(
    value: T,
    key?: K
  ): T & { [key in K]: KBInstance };
  describesDeclarationAbove(offset?: number): KBInstance;
}

export interface KBInstance extends KB {
  embed(
    alternativeLink: (createLink: (label?: string) => Node) => Node,
    condition: EmbedCondition
  ): Embed;
  forceEmbed(): Embed;
}

function callSite(frameOffset: number): SourceInfo | null {
  // The first line is the error (the error message is empty, so it take just one line.)
  // The second line is the stack of this very function.
  // Therefore, to get the stack of the caller, we must get the third line, i.e. index 2.
  const twoLinesBeforeCallerFrame = 2;
  const stackLine = new Error("").stack?.split("\n")?.[
    twoLinesBeforeCallerFrame + frameOffset
  ];
  if (!stackLine) return null;

  let locationMatch = /(file:\/\/[^\s]+)/.exec(stackLine);
  if (!locationMatch) return null;

  const location = fileURLToPath(decodeURI(locationMatch[1]));
  const parseMatch = /^(.+?):(\d+):(\d+)\)?$/.exec(location);
  if (!parseMatch) return null;

  const [, filepath, line, column] = parseMatch;
  return { filepath, line: Number(line), column: Number(column) };
}

export const d = Object.assign(
  createFactory((node) => node),
  { kb: kb("d").describesDeclarationAbove() }
);

export function link(target: LinkTarget, label: string | null = null): Link {
  return {
    type: NodeType.Link,
    target,
    label: label,
  };
}

export function list(...items: readonly (Node | KB)[]): List {
  return {
    type: NodeType.List,
    items: items.map(
      (item): Node =>
        typeof item === "object" && item?.type === NodeType.KB
          ? {
              type: NodeType.Embed,
              target: item,
              condition: null,
              contentIfLink: (link) => link(),
            }
          : item
    ),
  };
}

export function block<T>(style: T) {
  return createFactory(
    (content): Block => ({
      type: NodeType.Block,
      content,
      style: style,
    })
  );
}

export function inline<T>(style: T) {
  return createFactory(
    (content): Inline => ({
      type: NodeType.Inline,
      content,
      style: style,
    })
  );
}

declare global {
  // tslint:disable-next-line:no-unused-declaration
  interface ArrayConstructor {
    isArray(arg: ReadonlyArray<any> | any): arg is ReadonlyArray<any>;
  }
}
