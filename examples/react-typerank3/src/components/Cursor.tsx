import { forwardRef, type HTMLAttributes } from 'react';

interface CursorProps {
  visible?: boolean;
}

export const Cursor = forwardRef<HTMLDivElement, CursorProps & HTMLAttributes<HTMLDivElement>>( 
  ({ visible = true, className = '', ...rest }, ref) => {
    const classes = [
      'pitype-cursor',
      'cursor',
      visible ? 'pitype-cursor-visible cursor-visible' : '',
      className
    ]
      .filter(Boolean)
      .join(' ');
    return <div ref={ref} className={classes} {...rest} />;
  }
);

Cursor.displayName = 'Cursor';
