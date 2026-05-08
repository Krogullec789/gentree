/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { normalizeTreeData } from '../utils/treeData';
import type {
  EdgeMap,
  NewPersonNode,
  NodeMap,
  NodePosition,
  PersonNode,
  RelationshipType,
  TreeContextValue,
} from '../types/tree';

// Use env variable — falls back to localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TreeContext = createContext<TreeContextValue | null>(null);

export const useTreeInfo = (): TreeContextValue => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTreeInfo must be used within TreeProvider');
  }
  return context;
};

const createId = () => crypto.randomUUID();

interface TreeProviderProps {
  children: React.ReactNode;
}

export const TreeProvider = ({ children }: TreeProviderProps) => {
  const [nodes, setNodes] = useState<NodeMap>({});
  const [edges, setEdges] = useState<EdgeMap>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  // Temporary drag positions — updated every mousemove without touching global `nodes`
  const [dragPositions, setDragPositions] = useState<Record<string, NodePosition>>({});
  // Shared canvas scale so PersonNode can correct drag delta at zoom != 1
  const [canvasScale, setCanvasScale] = useState(1);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks how many effect invocations to skip (used to prevent re-saving data just loaded from server)
  const saveSkipCountRef = useRef(0);

  // Load from REST API on mount
  useEffect(() => {
    fetch(`${API_URL}/api/tree`)
      .then(res => res.json())
      .then(data => {
        const normalizedData = normalizeTreeData(data);
        const loadedNodes = normalizedData?.nodes || {};
        const loadedEdges = normalizedData?.edges || {};

        if (Object.keys(loadedNodes).length > 0) {
          // Skip saving the very next effect run — we just loaded this data, no need to POST it back
          saveSkipCountRef.current = 1;
          setNodes(loadedNodes);
          setEdges(loadedEdges);
        } else {
          // Empty DB — create a root node and let it save normally
          const rootId = createId();
          const rootNode: PersonNode = {
            id: rootId,
            firstName: 'Jan',
            lastName: 'Kowalski',
            maidenName: '',
            birthDate: '',
            deathDate: '',
            bio: 'Podstawowy zarys drzewa.',
            gender: 'male',
            avatar: '',
            x: window.innerWidth / 2 - 120,
            y: window.innerHeight / 2 - 50,
          };
          setNodes({ [rootId]: rootNode });
          setSelectedNodeId(rootId);
          setIsPanelOpen(true);
        }
      })
      .catch(e => console.error('Failed to fetch tree data', e));
  }, []);

  // Debounced auto-save — 500ms after last change, batch all edits into a single request
  useEffect(() => {
    if (Object.keys(nodes).length === 0) return;

    if (saveSkipCountRef.current > 0) {
      saveSkipCountRef.current -= 1;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      }).catch(e => console.error('Failed to save tree data', e));
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges]);

  const setDragPosition = (id: string, pos: NodePosition) => {
    setDragPositions(prev => ({ ...prev, [id]: pos }));
  };

  const clearDragPosition = (id: string) => {
    setDragPositions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addNode = (nodeData: NewPersonNode) => {
    const id = createId();
    const newNode = { id, ...nodeData };
    setNodes((prev) => ({ ...prev, [id]: newNode }));
    return id;
  };

  const updateNode = (id: string, updates: Partial<PersonNode>) => {
    setNodes((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], ...updates }
      };
    });
  };

  const removeNode = (id: string) => {
    setNodes((prev) => {
      const newNodes = { ...prev };
      delete newNodes[id];
      return newNodes;
    });
    setEdges((prev) => {
      const newEdges = { ...prev };
      for (const edgeId in newEdges) {
        if (newEdges[edgeId].sourceId === id || newEdges[edgeId].targetId === id) {
          delete newEdges[edgeId];
        }
      }
      return newEdges;
    });
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
      setIsPanelOpen(false);
    }
  };

  const addEdge = (sourceId: string, targetId: string, type: RelationshipType) => {
    const exists = Object.values(edges).some(
      (e) =>
        (e.sourceId === sourceId && e.targetId === targetId && e.type === type) ||
        (type === 'partner' && e.sourceId === targetId && e.targetId === sourceId && e.type === type)
    );
    if (!exists) {
      const id = createId();
      setEdges((prev) => ({ ...prev, [id]: { id, sourceId, targetId, type } }));
    }
  };

  const removeEdge = (id: string) => {
    setEdges((prev) => {
      const newEdges = { ...prev };
      delete newEdges[id];
      return newEdges;
    });
  };

  return (
    <TreeContext.Provider
      value={{
        nodes,
        edges,
        selectedNodeId,
        isPanelOpen,
        canvasScale,
        dragPositions,
        focusNodeId,
        setSelectedNodeId,
        setIsPanelOpen,
        setCanvasScale,
        setDragPosition,
        clearDragPosition,
        setFocusNodeId,
        addNode,
        updateNode,
        removeNode,
        addEdge,
        removeEdge,
        setNodes,
        setEdges,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
};
