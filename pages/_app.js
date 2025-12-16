// файл: _app.js

import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; 
import 'leaflet/dist/leaflet.css'; 

const theme = createTheme({
  palette: {
    // ЗМІНА №1: Встановлюємо світлий режим
    mode: 'light', 
    primary: {
      main: '#1976d2', // Стандартний синій
    },
    secondary: {
      main: '#dc004e', // Стандартний рожевий
    },
    background: {
      default: '#f5f5f5', // Світло-сірий фон
      paper: '#ffffff',   // Білий фон для Drawer/Paper
    },
    text: {
      primary: '#000000', // Чорний текст
      secondary: '#555555', // Сірий текст
    }
  },
  // Тіні зазвичай світліші у світлому режимі, але залишимо їх стандартними
  shadows: Array(25).fill('0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'),
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> // Додайте CssBaseline для стандартного скидання стилів
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;