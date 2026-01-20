'use client';
import { Exo_2 } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

const exo2 = Exo_2({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // A bright, futuristic cyan
    },
    secondary: {
      main: '#f50057', // A vibrant magenta for contrast
    },
    background: {
      default: '#0a0a0f', // Very dark blue/grey
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
    }
  },
  typography: {
    fontFamily: exo2.style.fontFamily,
    h1: {
      fontFamily: exo2.style.fontFamily,
    },
    h2: {
        fontFamily: exo2.style.fontFamily,
    },
    h3: {
        fontFamily: exo2.style.fontFamily,
    },
  },
});

export default theme;
