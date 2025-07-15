import React, { useState, useEffect, useRef } from 'react';
import { Fab, Paper, Collapse, IconButton, Box } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatContext } from '../../context/ChatContext';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isLoading } = useChatContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: isOpen ? 'none' : 'flex',
          zIndex: 1000,
        }}
        onClick={handleToggleChat}
      >
        <ChatIcon />
      </Fab>

      <Collapse in={isOpen} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <Paper
          elevation={3}
          sx={{
            width: 380,
            height: isMinimized ? 60 : 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ fontWeight: 'bold' }}>Farm Fresh Pet Support</Box>
            <Box>
              <IconButton
                size="small"
                sx={{ color: 'primary.contrastText' }}
                onClick={handleMinimize}
              >
                <MinimizeIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'primary.contrastText' }}
                onClick={handleToggleChat}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {!isMinimized && (
            <>
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: '#f5f5f5',
                }}
              >
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                    Welcome to Farm Fresh Pet! How can I help you today?
                  </Box>
                )}
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <ChatMessage
                    message={{
                      id: 'loading',
                      content: '...',
                      role: 'assistant',
                      timestamp: new Date(),
                    }}
                    isLoading
                  />
                )}
                <div ref={messagesEndRef} />
              </Box>

              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default ChatWidget;