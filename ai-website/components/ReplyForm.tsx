'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';

export default function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!author || !content) {
      alert('Please fill out all fields.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId, author, content }),
      });

      if (response.ok) {
        // Clear form and refresh the page to show the new reply
        setAuthor('');
        setContent('');
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Failed to post reply: ${errorData.error}`);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        Post a Reply
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
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="content"
          label="Your reply..."
          id="content"
          multiline
          rows={4}
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
          {isSubmitting ? 'Submitting...' : 'Submit Reply'}
        </Button>
      </Box>
    </Paper>
  );
}
