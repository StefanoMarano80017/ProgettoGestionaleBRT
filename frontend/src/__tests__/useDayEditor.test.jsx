import { renderHook, act } from '@testing-library/react';
import useDayEditor from '@hooks/Timesheet/useDayEditor';

/**
 * Tests for useDayEditor
 */

describe('useDayEditor', () => {
  it('opens and closes with correct state', () => {
    const { result } = renderHook(() => useDayEditor());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.openEditor('emp-1', '2025-10-05'));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.employeeId).toBe('emp-1');
    expect(result.current.date).toBe('2025-10-05');
    act(() => result.current.closeEditor());
    expect(result.current.isOpen).toBe(false);
  });

  it('restores focus to originating element after close', () => {
    const button = document.createElement('button');
    button.textContent = 'origin';
    document.body.appendChild(button);
    button.focus();
    const { result } = renderHook(() => useDayEditor());
    act(() => result.current.openEditor('emp-2', '2025-10-06'));
    expect(result.current.isOpen).toBe(true);
    // simulate Dialog close
    act(() => result.current.closeEditor());
    // Allow effect to run
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
      expect(document.activeElement).toBe(button);
    });
  });
});
