import type { EdgeMap, NodeMap, PersonNode, TreeData, TreeEdge } from '../types/tree';

const VALID_EDGE_TYPES = new Set(['parent-child', 'partner']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const collectionToRecord = <T extends { id: string }>(collection: unknown): Record<string, T> | null => {
  if (Array.isArray(collection)) {
    return collection.reduce<Record<string, T>>((record, item) => {
      if (isRecord(item) && typeof item.id === 'string') {
        record[item.id] = item as T;
      }
      return record;
    }, {});
  }

  return isRecord(collection) ? collection as Record<string, T> : null;
};

const isValidNode = (node: unknown, id: string): node is PersonNode => (
  isRecord(node) &&
  node.id === id &&
  typeof node.id === 'string' &&
  node.id.trim().length > 0 &&
  Number.isFinite(node.x) &&
  Number.isFinite(node.y)
);

const isValidEdge = (edge: unknown, id: string, nodes: NodeMap): edge is TreeEdge => (
  isRecord(edge) &&
  edge.id === id &&
  typeof edge.sourceId === 'string' &&
  typeof edge.targetId === 'string' &&
  typeof edge.type === 'string' &&
  VALID_EDGE_TYPES.has(edge.type) &&
  Boolean(nodes[edge.sourceId]) &&
  Boolean(nodes[edge.targetId])
);

export const normalizeTreeData = (data: unknown): TreeData | null => {
  if (!isRecord(data)) return null;

  const nodes = collectionToRecord<PersonNode>(data.nodes);
  const edges = collectionToRecord<TreeEdge>(data.edges);

  if (!nodes || !edges) return null;

  for (const [id, node] of Object.entries(nodes)) {
    if (!isValidNode(node, id)) return null;
  }

  for (const [id, edge] of Object.entries(edges)) {
    if (!isValidEdge(edge, id, nodes)) return null;
  }

  return { nodes: nodes as NodeMap, edges: edges as EdgeMap };
};

export const isValidTreeData = (data: unknown): data is TreeData => normalizeTreeData(data) !== null;
