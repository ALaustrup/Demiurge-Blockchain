'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Box, Fab, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Avatar, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useChat } from '@ai-sdk/react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const chat = useChat();
  const chatContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat window when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chat.handleSubmit(e);
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleToggle}
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 32,
            width: 350,
            height: 500,
            zIndex: 1299,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">AI Assistant</Typography>
          </Box>
          <List ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {chat.messages.map((m) => (
              <ListItem key={m.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <Avatar sx={{ bgcolor: m.role === 'assistant' ? 'secondary.main' : 'primary.main', ml: m.role === 'user' ? 1 : 0, mr: m.role === 'assistant' ? 1 : 0 }}>
                  {m.role === 'assistant' ? <SmartToyIcon /> : <AccountCircleIcon />}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: m.role === 'assistant' ? 'background.default' : 'primary.light',
                  }}
                >
                  <ListItemText primary={m.content} sx={{ m: 0 }} />
                </Paper>
              </ListItem>
            ))}
          </List>
          <Box
            component="form"
            onSubmit={handleFormSubmit}
            sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}
          >
            <TextField
              variant="outlined"
              fullWidth
              placeholder="Type a message..."
              value={chat.input}
              onChange={chat.handleInputChange}
              size="small"
            />
            <Button type="submit" variant="contained">Send</Button>
          </Box>
        </Paper>
      )}
    </>
  );
}
