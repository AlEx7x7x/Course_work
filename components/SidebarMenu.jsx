// components/SidebarMenu.jsx

import React from 'react';
import { Box, Typography, List, ListItem, Divider, Paper, ListItemText, ListItemButton, useTheme } from '@mui/material';
import Link from 'next/link';
// 🚨 ФІКС: Імпортуємо useRoutes безпосередньо
import { useRoutes } from '../utils/hooks'; 

// ... (Ваші допоміжні функції, такі як categorizeRoutes)

const categorizeRoutes = (routes) => {
  const categories = {};
  if (!Array.isArray(routes)) return {}; // Захист

  routes.forEach(route => {
    const type = route.route_type;
    if (!categories[type]) {
      categories[type] = [];
    }
    categories[type].push(route);
  });
  return categories;
};

// ... (Ваш компонент RouteCategory)

const RouteCategory = ({ name, routes, selectedRouteId, onSelectRoute }) => {
  const theme = useTheme();
  // ... (Ваш код відображення категорії)
  
  // 💡 Для демонстрації: відображаємо лише назву маршруту
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ p: 1, color: 'primary.main', fontWeight: 'bold' }}>
        {name} ({routes.length})
      </Typography>
      <List dense disablePadding>
        {routes.map((route) => (
          <ListItemButton
            key={route.route_id}
            selected={route.route_id === selectedRouteId}
            onClick={() => onSelectRoute(route.route_id === selectedRouteId ? null : route.route_id)}
            sx={{ 
                pl: 2, 
                py: 0.5,
                '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.dark,
                    '&:hover': {
                         backgroundColor: theme.palette.primary.dark,
                    }
                }
            }}
          >
            <ListItemText 
                primary={route.route_short_name} 
                secondary={route.route_long_name.split(' - ')[0]} 
                primaryTypographyProps={{ fontWeight: 'bold', fontSize: 14 }}
                secondaryTypographyProps={{ fontSize: 10, color: 'text.secondary' }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider />
    </Box>
  );
};


export default function SidebarMenu({ selectedRouteId, onSelectRoute }) {
  // 🚨 ФІКС: Викликаємо useRoutes безпосередньо
  const routes = useRoutes(); 
  const categories = categorizeRoutes(routes);
  
  const getCategoryName = (type) => {
    switch (type) {
      case '0': return 'Трамваї';
      case '3': return 'Автобуси/Маршрутки';
      default: return 'Інше';
    }
  };

  return (
    <Paper 
      sx={{ 
        width: 300, 
        flexShrink: 0, 
        height: '100%', 
        borderRight: `1px solid ${theme.palette.divider}`,
        position: 'fixed', // Фіксуємо сайдбар
        top: 64, // Під хедером
        left: 0,
        overflowY: 'auto',
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
          Маршрути 🚌
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {Object.keys(categories).sort().map(type => (
          <RouteCategory 
            key={type}
            name={getCategoryName(type)}
            routes={categories[type]}
            selectedRouteId={selectedRouteId}
            onSelectRoute={onSelectRoute}
          />
        ))}
      </Box>
    </Paper>
  );
}