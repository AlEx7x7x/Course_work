// файл: _app.js
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; 
import 'leaflet/dist/leaflet.css'; 

const theme = createTheme({
  palette: {
    mode: 'light', 
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#000000', secondary: '#555555' }
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      {/* 1. ДОДАЙ ЦЕЙ РЯДОК СЮДИ (він прибере відступи по краях) */}
      <CssBaseline /> 
      
      {/* 2. ПЕРЕКОНАЙСЯ, ЩО ТУТ НЕМАЄ НІЯКОГО ТЕКСТУ МІЖ ТЕГАМИ */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;