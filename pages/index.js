// pages/index.js
import dynamic from 'next/dynamic';
import hooks from '../utils/hooks'; 
import { CircularProgress, Box, Typography } from '@mui/material';
import Head from 'next/head';
import React, { useState, useMemo } from 'react'; 
import SidebarMenu from '../components/SidebarMenu'; 
import Header from '../components/Header'; 
import MapContainerWrapper from '../components/MapContainerWrapper'; // Створений компонент

// 🚨 КЛЮЧОВЕ ВИПРАВЛЕННЯ: Динамічний імпорт карти з вимкненим SSR
const DynamicMapContainer = dynamic(
  () => import('../components/MapContainerWrapper'), 
  { 
    ssr: false, 
    loading: () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <CircularProgress />
            <Typography ml={2}>Завантаження карти...</Typography>
        </Box>
    )
  }
);

export default function HomePage() {
  const { vehicles, isLoading } = hooks.useVehicles(); 
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const filteredVehicles = useMemo(() => {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : []; 

    if (!selectedRouteId) {
      return vehiclesArray;
    }
    
    return vehiclesArray.filter(v => v.routeId === selectedRouteId);
  }, [vehicles, selectedRouteId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Head>
        <title>Карта ТЗ | EasyWay Clone</title>
      </Head>
      
      <Header />
      
      <Box sx={{ display: 'flex', flexGrow: 1, paddingTop: '64px' }}>
        
        <SidebarMenu 
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId} 
        />

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            ml: '300px', 
            width: 'calc(100% - 300px)',
            display: 'flex', 
            flexDirection: 'column',
          }}
        >
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            {selectedRouteId ? `Показано транспорт лише для маршруту ${selectedRouteId}` : 'Показано всі транспортні засоби.'}
          </Typography>
          
          <DynamicMapContainer vehicles={filteredVehicles} />

        </Box>
      </Box>
    </Box>
  );
}