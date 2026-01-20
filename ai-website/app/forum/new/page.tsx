'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !author || !content) {
      alert('Please fill out all fields.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author, content }),
      });

      if (response.ok) {
        router.push('/forum');
      } else {
        const errorData = await response.json();
        alert(`Failed to create thread: ${errorData.error}`);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create a New Thread
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="author"
            label="Your Name"
            name="author"
            autoComplete="name"
            autoFocus
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Thread Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="content"
            label="What's on your mind?"
            id="content"
            multiline
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Create Thread'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
