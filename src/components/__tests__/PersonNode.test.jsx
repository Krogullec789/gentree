import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import PersonNode from '../PersonNode';
import * as TreeContextModule from '../../store/TreeContext';

const mockTreeContext = {
  selectedNodeId: null,
  setSelectedNodeId: vi.fn(),
  setIsPanelOpen: vi.fn(),
  updateNode: vi.fn(),
  canvasScale: 1,
  setDragPosition: vi.fn(),
  clearDragPosition: vi.fn()
};

vi.spyOn(TreeContextModule, 'useTreeInfo').mockReturnValue(mockTreeContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PersonNode Component', () => {
  it('renders student data correctly', () => {
    const nodeData = {
      id: '1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      birthDate: '1980-01-01',
      gender: 'male',
      x: 100,
      y: 100
    };

    render(<PersonNode node={nodeData} />);
    
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('1980')).toBeInTheDocument();
  });

  it('moves the node with keyboard arrows when the drag handle is focused', async () => {
    const user = userEvent.setup();
    const nodeData = {
      id: '1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      birthDate: '1980-01-01',
      gender: 'male',
      x: 100,
      y: 100
    };

    render(<PersonNode node={nodeData} />);
    screen.getByLabelText('Przesuń osobę').focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');

    expect(mockTreeContext.updateNode).toHaveBeenNthCalledWith(1, '1', { x: 110, y: 100 });
    expect(mockTreeContext.updateNode).toHaveBeenNthCalledWith(2, '1', { x: 100, y: 110 });
  });
});
