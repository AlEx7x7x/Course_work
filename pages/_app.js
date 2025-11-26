// pages/_app.js

import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import 'leaflet/dist/leaflet.css';
// СТВОРЮЄМО ТЕМНУ ТЕМУ З КРАЩИМИ КОЛЬОРАМИ
const theme = createTheme({
  palette: {
    mode: 'dark', // ⬅️ Встановлюємо темний режим
    primary: {
      main: '#42a5f5', // Світло-синій для акцентів
    },
    secondary: {
      main: '#f50057', // Малиновий для додаткових акцентів
    },
    background: {
      default: '#121212', // Темний фон сторінки
      paper: '#1e1e1e',   // Трохи світліший фон для бічного меню та карток
    },
    text: {
      primary: '#ffffff', // Білий текст
      secondary: '#b3b3b3', // Світло-сірий текст
    }
  },
  
  // Додаємо трохи більш виразні тіні для кращого 3D ефекту в темній темі
  shadows: Array(25).fill('0px 2px 4px -1px rgba(0,0,0,0.4), 0px 4px 5px 0px rgba(0,0,0,0.28), 0px 1px 10px 0px rgba(0,0,0,0.24)'),
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline нормалізує стилі, використовуючи нову тему */}
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;