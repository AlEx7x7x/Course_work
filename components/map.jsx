// components/Map.jsx (ФІКС: Уникнення SSR для Leaflet)

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Typography, Box } from '@mui/material';

// ----------------------------------------------------
// Налаштування іконок та логіки Leaflet (КЛІЄНТСЬКИЙ КОД)
// ----------------------------------------------------
const setupLeaflet = () => {
    // 🚨 ЦЕЙ КОД ВИКОНУЄТЬСЯ ЛИШЕ У BROWSER (НА КЛІЄНТІ)
    if (typeof window !== 'undefined') {
        const L = require('leaflet');

        // Виправлення шляху до стандартних іконок Leaflet
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
          iconUrl: '/leaflet/images/marker-icon.png',
          shadowUrl: '/leaflet/images/marker-shadow.png',
        });

        // Кастомна іконка для транспорту
        const BusIcon = (routeId) => {
            const iconSize = [30, 30]; 
            const displayId = routeId ? routeId.replace(/[^0-9A-Za-z]/g, '') : '?'; 

            const htmlContent = `
                <div style="
                    background-color: #42a5f5; 
                    color: white; 
                    border-radius: 50%; 
                    width: ${iconSize[0]}px; 
                    height: ${iconSize[1]}px;
                    text-align: center;
                    line-height: ${iconSize[1]}px;
                    font-size: 10px;
                    font-weight: bold;
                    border: 2px solid #1e1e1e;
                    box-shadow: 0 0 5px rgba(0,0,0,0.5);
                ">
                    ${displayId}
                </div>
            `;

            return L.divIcon({
                className: 'custom-bus-icon',
                html: htmlContent,
                iconSize: iconSize,
                iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
                popupAnchor: [0, -iconSize[1] / 2],
            });
        };
        return BusIcon;
    }
    return () => null; // Повертаємо заглушку для SSR
};

// ----------------------------------------------------
// Компонент, який оновлює центр карти
// ----------------------------------------------------
const MapCenterUpdater = ({ vehicles }) => {
  const map = useMap();
  const defaultCenter = [49.8397, 24.0297]; // Львів
  
  React.useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const latSum = vehicles.reduce((sum, v) => sum + v.lat, 0);
      const lngSum = vehicles.reduce((sum, v) => sum + v.lng, 0);
      const avgLat = latSum / vehicles.length;
      const avgLng = lngSum / vehicles.length;
      
      map.flyTo([avgLat, avgLng], map.getZoom() < 12 ? 13 : map.getZoom()); 
    } else {
      map.flyTo(defaultCenter, 13);
    }
  }, [vehicles, map]); 

  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    />
  );
};

// ----------------------------------------------------
// ОСНОВНИЙ КОМПОНЕНТ КАРТИ
// ----------------------------------------------------
export default function Map({ vehicles = [] }) {
  const defaultCenter = [49.8397, 24.0297]; // Львів
  
  const BusIcon = setupLeaflet();

  const memoizedMarkers = useMemo(() => {
    // Рендеринг маркерів
    return vehicles
        .filter(v => v.lat && v.lng)
        .map((vehicle) => (
            <Marker 
                key={vehicle.id} 
                position={[vehicle.lat, vehicle.lng]}
                icon={BusIcon(vehicle.routeId)} // Використовуємо функцію, що перевірена на клієнті
            >
                <Popup>
                    <Box>
                        <Typography variant="h6">{vehicle.numberPlate || vehicle.routeId}</Typography>
                        <Typography variant="body2">Маршрут: **{vehicle.routeId || 'Невідомий'}**</Typography>
                        <Typography variant="body2" color="text.secondary">Швидкість: **{Math.round(vehicle.speed)} км/год**</Typography>
                    </Box>
                </Popup>
            </Marker>
        ));
  }, [vehicles, BusIcon]);

  return (
        <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }} 
        >
            <MapCenterUpdater vehicles={vehicles} />
            {memoizedMarkers}
        </MapContainer>
  );
}