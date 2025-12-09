
import React, { useMemo } from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme, IconButton } from '@mui/material';

const HeaderIcon = React.memo(() => {
    if (typeof window !== 'undefined') {
        const DirectionsBusIcon = require('@mui/icons-material/DirectionsBus').default;
        return <DirectionsBusIcon />;
    }
    return '🚌';
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