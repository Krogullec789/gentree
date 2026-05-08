import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import Header from '../Header';
import * as TreeContextModule from '../../store/TreeContext';
import type { TreeContextValue } from '../../types/tree';

const mockTreeContext: TreeContextValue = {
  nodes: {},
  edges: {},
  selectedNodeId: null,
  isPanelOpen: false,
  canvasScale: 1,
  dragPositions: {},
  focusNodeId: null,
  setCanvasScale: vi.fn(),
  setDragPosition: vi.fn(),
  clearDragPosition: vi.fn(),
  addNode: vi.fn(),
  updateNode: vi.fn(),
  removeNode: vi.fn(),
  addEdge: vi.fn(),
  removeEdge: vi.fn(),
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  setSelectedNodeId: vi.fn(),
  setIsPanelOpen: vi.fn(),
  setFocusNodeId: vi.fn()
};

vi.spyOn(TreeContextModule, 'useTreeInfo').mockReturnValue(mockTreeContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header Component', () => {
  it('renders correctly with title and buttons', () => {
    render(<Header />);
    expect(screen.getByText('GenTree')).toBeInTheDocument();
    expect(screen.getByText('Premium Family Tree')).toBeInTheDocument();
    expect(screen.getByText('Importuj JSON')).toBeInTheDocument();
    expect(screen.getByText('Eksportuj')).toBeInTheDocument();
  });

  it('rejects imported JSON with an invalid tree shape', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const invalidFile = new File(
      [JSON.stringify({ nodes: null, edges: {} })],
      'invalid-tree.json',
      { type: 'application/json' }
    );

    render(<Header />);
    await user.upload(screen.getByLabelText('Importuj JSON'), invalidFile);

    expect(mockTreeContext.setNodes).not.toHaveBeenCalled();
    expect(mockTreeContext.setEdges).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Nieprawidłowy plik z danymi drzewa.');

    alertSpy.mockRestore();
  });
});
