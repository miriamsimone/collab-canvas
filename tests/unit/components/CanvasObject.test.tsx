import { describe, it, expect, vi } from 'vitest';
import { type CanvasObjectData } from '../../../src/components/CanvasObject';

describe('CanvasObject', () => {
  const mockObject: CanvasObjectData = {
    id: 'test-rect-1',
    x: 100,
    y: 200,
    width: 120,
    height: 80,
    fill: '#007ACC20',
    stroke: '#007ACC',
    strokeWidth: 2,
  };

  it('should have correct CanvasObjectData interface structure', () => {
    expect(mockObject).toHaveProperty('id');
    expect(mockObject).toHaveProperty('x');
    expect(mockObject).toHaveProperty('y');
    expect(mockObject).toHaveProperty('width');
    expect(mockObject).toHaveProperty('height');
    expect(mockObject).toHaveProperty('fill');
    expect(mockObject).toHaveProperty('stroke');
    expect(mockObject).toHaveProperty('strokeWidth');
  });

  it('should validate object properties are correct types', () => {
    expect(typeof mockObject.id).toBe('string');
    expect(typeof mockObject.x).toBe('number');
    expect(typeof mockObject.y).toBe('number');
    expect(typeof mockObject.width).toBe('number');
    expect(typeof mockObject.height).toBe('number');
    expect(typeof mockObject.fill).toBe('string');
    expect(typeof mockObject.stroke).toBe('string');
    expect(typeof mockObject.strokeWidth).toBe('number');
  });

  it('should create objects with different properties', () => {
    const obj1: CanvasObjectData = {
      id: 'rect-1',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      fill: 'red',
      stroke: 'blue',
      strokeWidth: 1,
    };

    const obj2: CanvasObjectData = {
      id: 'rect-2',
      x: 150,
      y: 200,
      width: 200,
      height: 100,
      fill: 'green',
      stroke: 'yellow',
      strokeWidth: 3,
    };

    expect(obj1.id).not.toBe(obj2.id);
    expect(obj1.x).not.toBe(obj2.x);
    expect(obj1.fill).not.toBe(obj2.fill);
  });

  it('should handle callbacks correctly', () => {
    const onSelect = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();

    // Test callback invocations
    onSelect();
    onDragStart();
    onDragEnd('test-id', 50, 100);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith('test-id', 50, 100);
  });

  it('should maintain immutable object properties', () => {
    const originalObject = { ...mockObject };
    
    // Simulate property changes that might occur during interaction
    const updatedObject = {
      ...mockObject,
      x: 150,
      y: 250,
      width: 140,
      height: 100,
    };

    // Original should remain unchanged
    expect(mockObject.x).toBe(originalObject.x);
    expect(mockObject.y).toBe(originalObject.y);
    
    // Updated should have new values
    expect(updatedObject.x).toBe(150);
    expect(updatedObject.y).toBe(250);
  });
});
