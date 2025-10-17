import React, { useState } from 'react';

interface AICommandInputProps {
  onExecuteCommand: (prompt: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const AICommandInput: React.FC<AICommandInputProps> = ({
  onExecuteCommand,
  isLoading,
  disabled = false,
  placeholder = "Type a command... (e.g., 'create a red rectangle')",
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      await onExecuteCommand(input.trim());
      setInput(''); // Clear input after successful submission
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ai-command-input">
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          className="command-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className="submit-button"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </div>
      
    </form>
  );
};
