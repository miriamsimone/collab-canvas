import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toolbar, type ToolType } from '../../../src/components/Toolbar';

describe('Toolbar', () => {
  const mockOnToolChange = vi.fn();
  
  const defaultProps = {
    activeTool: 'rectangle' as ToolType,
    onToolChange: mockOnToolChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toolbar with title', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('should render select and rectangle tool buttons', () => {
    render(<Toolbar {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument();
  });

  it('should highlight active tool', () => {
    render(<Toolbar {...defaultProps} activeTool="rectangle" />);
    
    const rectangleButton = screen.getByRole('button', { name: /rectangle/i });
    const selectButton = screen.getByRole('button', { name: /select/i });
    
    expect(rectangleButton).toHaveClass('active');
    expect(selectButton).not.toHaveClass('active');
  });

  it('should highlight select tool when active', () => {
    render(<Toolbar {...defaultProps} activeTool="select" />);
    
    const rectangleButton = screen.getByRole('button', { name: /rectangle/i });
    const selectButton = screen.getByRole('button', { name: /select/i });
    
    expect(selectButton).toHaveClass('active');
    expect(rectangleButton).not.toHaveClass('active');
  });

  it('should call onToolChange when rectangle tool is clicked', () => {
    render(<Toolbar {...defaultProps} activeTool="select" />);
    
    const rectangleButton = screen.getByRole('button', { name: /rectangle/i });
    fireEvent.click(rectangleButton);
    
    expect(mockOnToolChange).toHaveBeenCalledWith('rectangle');
    expect(mockOnToolChange).toHaveBeenCalledTimes(1);
  });

  it('should call onToolChange when select tool is clicked', () => {
    render(<Toolbar {...defaultProps} activeTool="rectangle" />);
    
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);
    
    expect(mockOnToolChange).toHaveBeenCalledWith('select');
    expect(mockOnToolChange).toHaveBeenCalledTimes(1);
  });

  it('should display current tool info', () => {
    render(<Toolbar {...defaultProps} activeTool="rectangle" />);
    
    expect(screen.getByText('Current:')).toBeInTheDocument();
    expect(screen.getByText((content, node) => {
      const hasText = (element: Element) => element.textContent === 'Current: Rectangle';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node?.children || []).every(child => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();
  });

  it('should display select tool info when select is active', () => {
    render(<Toolbar {...defaultProps} activeTool="select" />);
    
    expect(screen.getByText('Current:')).toBeInTheDocument();
    expect(screen.getByText((content, node) => {
      const hasText = (element: Element) => element.textContent === 'Current: Select';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node?.children || []).every(child => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();
  });

  it('should display appropriate instructions for rectangle tool', () => {
    render(<Toolbar {...defaultProps} activeTool="rectangle" />);
    
    expect(screen.getByText('Click on canvas to create rectangles')).toBeInTheDocument();
  });

  it('should display appropriate instructions for select tool', () => {
    render(<Toolbar {...defaultProps} activeTool="select" />);
    
    expect(screen.getByText('Click rectangles to select, drag to move')).toBeInTheDocument();
  });

  it('should show tool icons', () => {
    render(<Toolbar {...defaultProps} />);
    
    expect(screen.getByText('🔍')).toBeInTheDocument(); // Select tool icon
    expect(screen.getByText('⬜')).toBeInTheDocument(); // Rectangle tool icon
  });

  it('should have proper button structure', () => {
    render(<Toolbar {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('toolbar-button');
    });
  });

  it('should show tooltips on buttons', () => {
    render(<Toolbar {...defaultProps} />);
    
    const selectButton = screen.getByRole('button', { name: /select/i });
    const rectangleButton = screen.getByRole('button', { name: /rectangle/i });
    
    expect(selectButton).toHaveAttribute('title', 'Select and move rectangles');
    expect(rectangleButton).toHaveAttribute('title', 'Click to create rectangles');
  });
});
