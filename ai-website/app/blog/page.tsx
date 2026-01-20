import Link from 'next/link';
import { Container, Typography, Card, CardActionArea, CardContent, Grid } from '@mui/material';
import { getSortedPostsData } from '@/lib/posts';
import FormattedDate from '@/components/FormattedDate';

export default function BlogIndexPage() {
  const allPostsData = getSortedPostsData();

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        The Demiurge Blog
      </Typography>
      <Grid container spacing={4}>
        {allPostsData.map(({ slug, title, date, excerpt }) => (
          <Grid item xs={12} md={6} key={slug}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <Link href={`/blog/${slug}`} passHref style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <FormattedDate dateString={date} />
                    </Typography>
                    <Typography variant="body1">
                      {excerpt}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
