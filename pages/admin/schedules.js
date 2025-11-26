// pages/admin/schedules.js

import { Box, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useState, useEffect } from 'react';
import hooks from '../../utils/hooks';
import ScheduleTable from '../../components/ScheduleTable';
import Head from 'next/head';

export default function AdminSchedulesPage() {
  const routes = hooks.useRoutes(); 
  const [selectedRouteId, setSelectedRouteId] = useState('');
  
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
        setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || {};

  return (
    <Box sx={{ p: 4 }}>
      <Head>
        <title>Контроль Графіків | Адмін-Панель</title>
      </Head>
      <Typography variant="h4" gutterBottom>
        Панель Контролю Графіків 📊
      </Typography>

      <FormControl sx={{ minWidth: 250, mb: 3 }}>
        <InputLabel>Виберіть Маршрут</InputLabel>
        <Select
          value={selectedRouteId}
          label="Виберіть Маршрут"
          onChange={(e) => setSelectedRouteId(e.target.value)}
        >
          {routes.map((route) => (
            <MenuItem key={route.id} value={route.id}>
              {route.name} ({route.description})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Передаємо вибраний маршрут у таблицю */}
      <ScheduleTable routeId={selectedRouteId} routeName={selectedRoute.name} />
    </Box>
  );
}