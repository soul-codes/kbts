import { KB, Node, NodeType } from "./types.js";

export function isKb(nodeOrKb: Node | KB): nodeOrKb is KB {
  return (
    typeof nodeOrKb === "object" &&
    nodeOrKb != null &&
    nodeOrKb.type === NodeType.KB
  );
}
