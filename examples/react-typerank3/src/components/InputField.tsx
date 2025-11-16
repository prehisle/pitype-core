import { forwardRef } from 'react';

export const InputField = forwardRef<HTMLInputElement>((props, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      id="input-field"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      {...props}
    />
  );
});

InputField.displayName = 'InputField';
