import { forwardRef } from 'react';

interface CursorProps {
  visible?: boolean;
}

export const Cursor = forwardRef<HTMLDivElement, CursorProps>(({ visible = true }, ref) => {
  return <div ref={ref} className={`cursor ${visible ? 'cursor-visible' : ''}`} />;
});

Cursor.displayName = 'Cursor';
