import React from 'react';
import { Box, Avatar, Typography, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PetsIcon from '@mui/icons-material/Pets';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 2,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'secondary.main' : 'primary.main',
          width: 32,
          height: 32,
          mx: 1,
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <PetsIcon fontSize="small" />}
      </Avatar>
      
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: isUser ? 'secondary.light' : 'white',
          borderRadius: 2,
          p: 1.5,
          boxShadow: 1,
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        )}
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatMessage;