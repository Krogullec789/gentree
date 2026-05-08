const VALID_EDGE_TYPES = new Set(['parent-child', 'partner']);

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const collectionToRecord = (collection) => {
  if (Array.isArray(collection)) {
    return collection.reduce((record, item) => {
      if (isRecord(item) && typeof item.id === 'string') {
        record[item.id] = item;
      }
      return record;
    }, {});
  }

  return isRecord(collection) ? collection : null;
};

const isValidNode = (node, id) => (
  isRecord(node) &&
  node.id === id &&
  node.id.trim().length > 0 &&
  Number.isFinite(node.x) &&
  Number.isFinite(node.y)
);

const isValidEdge = (edge, id, nodes) => (
  isRecord(edge) &&
  edge.id === id &&
  typeof edge.sourceId === 'string' &&
  typeof edge.targetId === 'string' &&
  VALID_EDGE_TYPES.has(edge.type) &&
  Boolean(nodes[edge.sourceId]) &&
  Boolean(nodes[edge.targetId])
);

export const normalizeTreeData = (data) => {
  if (!isRecord(data)) return null;

  const nodes = collectionToRecord(data.nodes);
  const edges = collectionToRecord(data.edges);

  if (!nodes || !edges) return null;

  for (const [id, node] of Object.entries(nodes)) {
    if (!isValidNode(node, id)) return null;
  }

  for (const [id, edge] of Object.entries(edges)) {
    if (!isValidEdge(edge, id, nodes)) return null;
  }

  return { nodes, edges };
};

export const isValidTreeData = (data) => normalizeTreeData(data) !== null;
