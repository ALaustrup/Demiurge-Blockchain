import { getPostData, getAllPostSlugs } from '@/lib/posts';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import FormattedDate from '@/components/FormattedDate';

// This function tells Next.js which paths to pre-render
export async function generateStaticParams() {
  const paths = getAllPostSlugs();
  return paths;
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const postData = await getPostData(params.slug);

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
        <Box component="article">
          <Typography variant="h3" component="h1" gutterBottom>
            {postData.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <FormattedDate dateString={postData.date} />
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box
            className="prose-styles"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
          />
        </Box>
      </Paper>
    </Container>
  );
}
