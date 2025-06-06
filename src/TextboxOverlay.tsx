import React, { useState, useRef, useEffect } from 'react';

interface Textbox {
  id: string;
  x: number;
  y: number;
  text: string;
  isEditing: boolean;
}

interface TextboxOverlayProps {
  textboxes: Textbox[];
  setTextboxes: React.Dispatch<React.SetStateAction<Textbox[]>>;
  isTextboxMode: boolean;
  setIsTextboxMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TextboxOverlay = ({
  textboxes,
  setTextboxes,
  isTextboxMode,
  setIsTextboxMode
}: TextboxOverlayProps) => {
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // KeyBindings
  useEffect(() => {
    let isTabPressed = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track Tab key press
      if (e.code === 'Tab') {
        e.preventDefault(); // Prevent default tab behavior
        isTabPressed = true;
        return;
      }
      
      // Check for Tab+T combination
      if (isTabPressed && e.code === 'KeyT') {
        e.preventDefault();
        setIsTextboxMode(prev => !prev);
      }
      
      if ((e.key === 'Escape' || e.code === 'Escape') && isTextboxMode) {
        e.preventDefault();
        setIsTextboxMode(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        isTabPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isTextboxMode, setIsTextboxMode]);

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    setTextboxes(textboxes.map(tb => {
      if (tb.id === dragState.id) {
        return {
          ...tb,
          x: tb.x + dx,
          y: tb.y + dy
        };
      }
      return tb;
    }));

    setDragState({
      ...dragState,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setDragState(null);
  };

  // Add and remove event listeners for drag
  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  // Handle click events for textbox placement
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isTextboxMode) return;

    const newTextbox: Textbox = {
      id: `textbox-${Date.now()}`,
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
      text: '',
      isEditing: true
    };

    setTextboxes(prev => [...prev, newTextbox]);
    setIsTextboxMode(false);
  };

  // Handle text changes
  const handleTextChange = (id: string, text: string) => {
    setTextboxes(textboxes.map(tb =>
      tb.id === id ? { ...tb, text, isEditing: false } : tb
    ));
  };

  return (
    <>
      {/* Overlay for textbox placement */}
      {isTextboxMode && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            cursor: 'crosshair',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Click anywhere to add a textbox
          </div>
        </div>
      )}

      {/* Existing Textboxes */}
      {textboxes.map(textbox => (
        <div
          key={textbox.id}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragState({
              id: textbox.id,
              startX: e.clientX,
              startY: e.clientY
            });
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setTextboxes(textboxes.map(tb =>
              tb.id === textbox.id ? { ...tb, isEditing: true } : tb
            ));
          }}
          style={{
            position: 'absolute',
            left: textbox.x,
            top: textbox.y,
            backgroundColor: '#dddddd',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            zIndex: 1000,
            cursor: 'move',
          }}
        >
          {textbox.isEditing ? (
            <div style={{ position: 'relative' }}>
              <textarea
                autoFocus
                value={textbox.text}
                onChange={(e) => {
                  setTextboxes(textboxes.map(tb =>
                    tb.id === textbox.id ? { ...tb, text: e.target.value } : tb
                  ));
                }}
                onBlur={(e) => {
                  if (!e.relatedTarget?.matches('button')) {
                    handleTextChange(textbox.id, e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextChange(textbox.id, e.currentTarget.value);
                    setTextboxes(textboxes.map(tb =>
                      tb.id === textbox.id ? { ...tb, isEditing: false } : tb
                    ));
                  }
                }}
                style={{
                  width: '200px',
                  minHeight: '60px',
                  border: 'none',
                  resize: 'both',
                  paddingRight: '24px',
                  backgroundColor: '#dddddd',
                  outline: 'none',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTextboxes(textboxes.filter(tb => tb.id !== textbox.id));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '20px',
                  height: '20px',
                  padding: '0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  lineHeight: '1',
                  fontWeight: 'bold',
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              {textbox.text || 'Double-click to edit'}
            </div>
          )}
        </div>
      ))}
    </>
  );
}; 