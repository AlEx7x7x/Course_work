// components/Header.jsx (ФІНАЛЬНЕ ВИПРАВЛЕННЯ)

import React, { useMemo } from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme, IconButton } from '@mui/material';

// 🚨 Заглушка, щоб уникнути помилки імпорту на рівні Node.js
const HeaderIcon = React.memo(() => {
    // 🚨 Ми використовуємо require, щоб імпортувати іконку лише на клієнті,
    // запобігаючи помилці ERR_UNSUPPORTED_DIR_IMPORT під час SSR.
    if (typeof window !== 'undefined') {
        const DirectionsBusIcon = require('@mui/icons-material/DirectionsBus').default;
        return <DirectionsBusIcon />;
    }
    return '🚌'; // Заглушка для SSR
});

export default function Header() {
  const theme = useTheme();

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1, 
        backgroundColor: theme.palette.background.paper, 
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
            <HeaderIcon /> 
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
      </Toolbar>
    </AppBar>
  );
}