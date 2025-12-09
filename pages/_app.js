
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; 
import 'leaflet/dist/leaflet.css'; 

const theme = createTheme({
  palette: {
    mode: 'dark', 
    primary: {
      main: '#42a5f5', 
    },
    secondary: {
      main: '#f50057', 
    },
    background: {
      default: '#000000ff', 
      paper: '#1e1e1e',   
    },
    text: {
      primary: '#000000ff', 
      secondary: '#b3b3b3', 
    }
  },
  shadows: Array(25).fill('0px 2px 4px -1px rgba(0,0,0,0.4), 0px 4px 5px 0px rgba(0,0,0,0.28), 0px 1px 10px 0px rgba(0,0,0,0.24)'),
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;