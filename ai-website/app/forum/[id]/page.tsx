import { getThreadById } from '@/lib/forum';
import ReplyForm from '@/components/ReplyForm';
import { Container, Typography, Box, Paper, Divider, List, ListItem, ListItemText, Avatar } from '@mui/material';
import FormattedDate from '@/components/FormattedDate';

export default function ThreadPage({ params }: { params: { id: string } }) {
  const thread = getThreadById(params.id);

  if (!thread) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Typography variant="h4" align="center">Thread not found.</Typography>
      </Container>
    );
  }

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: 'numeric',
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      {/* Original Post */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {thread.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          By {thread.author} on <FormattedDate dateString={thread.date} options={dateTimeOptions} />
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {thread.content}
        </Typography>
      </Paper>

      {/* Replies */}
      <Typography variant="h5" component="h2" gutterBottom>
        Replies ({thread.replies.length})
      </Typography>
      <List>
        {thread.replies.map((reply) => (
          <Paper key={reply.id} elevation={1} sx={{ mb: 2, p: 2 }}>
            <ListItem alignItems="flex-start">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{reply.author.charAt(0)}</Avatar>
              <ListItemText
                primary={reply.author}
                secondary={
                  <>
                    <Typography
                      sx={{ display: 'block' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      <FormattedDate dateString={reply.date} options={dateTimeOptions} />
                    </Typography>
                    {reply.content}
                  </>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>
      
      <ReplyForm threadId={thread.id} />

    </Container>
  );
}
