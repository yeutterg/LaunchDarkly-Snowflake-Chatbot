import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message } from '../components/Chat/ChatMessage';

interface ChatContextType {
  messages: Message[];
  sessionId: string;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('chatSessionId');
    const storedMessages = sessionStorage.getItem('chatMessages');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      sessionStorage.setItem('chatSessionId', newSessionId);
    }
    
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          userEmail: localStorage.getItem('userEmail') || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(data.timestamp),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: 'Sorry, I encountered an error. Please try again later.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    sessionStorage.removeItem('chatMessages');
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    sessionStorage.setItem('chatSessionId', newSessionId);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        isLoading,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};