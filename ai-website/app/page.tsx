'use client';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            textShadow: '0 0 15px #00e5ff80',
          }}
        >
          The Demiurge Codex
        </Typography>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ color: 'text.secondary', maxWidth: '700px', mb: 4 }}
        >
          The ultimate, AI-powered knowledgebase for the Demiurge Blockchain. Explore the whitepaper, read the latest updates, and engage with the community.
        </Typography>
        <Button component={Link} href="/blog" variant="contained" size="large">
          Explore The Blog
        </Button>
      </Box>
    </Container>
  );
}
