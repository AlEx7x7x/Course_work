// components/Header.jsx

import React from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme, IconButton } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
// 💡 Можна додати інструменти для пошуку чи перемикання теми пізніше

export default function Header() {
  const theme = useTheme();

  return (
    <AppBar 
      position="fixed" // Фіксуємо хедер
      sx={{ 
        zIndex: theme.zIndex.drawer + 1, // Над сайдбаром
        backgroundColor: theme.palette.background.paper, // Використовуємо 'paper' для гарного темного фону
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
            edge="start"
            color="primary"
            aria-label="menu"
            sx={{ mr: 2 }}
        >
            <DirectionsBusIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          color="primary" 
          sx={{ fontWeight: 'bold' }}
        >
          Lviv Transit Tracker (GTFS)
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
        
        {/* 💡 Тут можна додати інші елементи, такі як поле пошуку */}

      </Toolbar>
    </AppBar>
  );
}