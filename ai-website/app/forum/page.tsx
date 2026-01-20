import Link from 'next/link';
import { Container, Typography, Box, Button, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { getThreads } from '@/lib/forum';
import FormattedDate from '@/components/FormattedDate';

export default function ForumIndexPage() {
  const threads = getThreads();

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1">
          Community Forum
        </Typography>
        <Button component={Link} href="/forum/new" variant="contained" size="large">
          Create New Thread
        </Button>
      </Box>
      <Paper elevation={3}>
        <List>
          {threads.map((thread, index) => (
            <React.Fragment key={thread.id}>
              <Link href={`/forum/${thread.id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItem
                  button
                >
                  <ListItemText
                    primary={thread.title}
                    secondary={<>by {thread.author} on <FormattedDate dateString={thread.date} /></>}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {thread.replies.length} replies
                  </Typography>
                </ListItem>
              </Link>
              {index < threads.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
