import React, { useState, KeyboardEvent } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        size="small"
        multiline
        maxRows={3}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                color="primary"
                size="small"
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ChatInput;