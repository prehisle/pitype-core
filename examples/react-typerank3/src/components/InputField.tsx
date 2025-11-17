import { forwardRef, type InputHTMLAttributes } from 'react';

export const InputField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>( 
  ({ className = '', ...props }, ref) => {
    const classes = ['pitype-input', className].filter(Boolean).join(' ');
    return (
      <input
        ref={ref}
        type="text"
        id="input-field"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        className={classes}
        {...props}
      />
    );
  }
);

InputField.displayName = 'InputField';
