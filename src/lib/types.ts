export interface Lazy {
  type: NodeType.Lazy;
  content: () => Node;
}

export interface KB {
  type: NodeType.KB;
  title: string;
  content: Node;
  embedCondition: EmbedCondition;
  emitCondition: EmitCondition | null;
  declaration: KBDeclarationCorrelation | null;
}

export interface Series {
  title: string;
  index: Node;
  items: readonly KB[];
  sequential: boolean;
}

export interface KBDeclarationCorrelation {
  source: SourceInfo | null;
  offset: number;
}

export interface SourceInfo {
  filepath: string;
  line: number;
  column: number;
}

export type EmbedCondition =
  | boolean
  | EmbedCondition_NoSeries
  | EmbedCondition_ReferenceCount
  | null;

export type EmitCondition = boolean;

export interface EmbedCondition_ReferenceCount {
  type: "reference_count";
  maxReferenceCount: number;
}

export interface EmbedCondition_NoSeries {
  type: "no_series";
}

export type Node =
  | Lazy
  | Fragment
  | Link
  | List
  | Block
  | Embed
  | Inline
  | string
  | number
  | null;

export interface Fragment {
  type: NodeType.Fragment;
  content: readonly Node[];
}

export interface Link {
  type: NodeType.Link;
  target: LinkTarget;
  label: string | null;
}

export interface Embed {
  type: NodeType.Embed;
  target: KB;
  contentIfLink: (createTargetLink: (label?: string) => Node) => Node;
  condition: EmbedCondition;
}

export interface List {
  type: NodeType.List;
  items: readonly Node[];
}

export interface Block {
  type: NodeType.Block;
  content: Node;
  style: unknown;
}

export interface Inline {
  type: NodeType.Inline;
  content: Node;
  style: unknown;
}

export enum NodeType {
  KB,
  Fragment,
  Link,
  Section,
  List,
  Block,
  Inline,
  Lazy,
  Embed,
}

export type LinkTarget = string | KB;
