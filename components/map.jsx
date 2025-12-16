import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getMockVehicles } from '../utils/mockVehicleSimulator'; 
import { Box } from '@mui/material'; 

if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    });
}

// Функція для форматування часу прибуття
const formatArrivalTime = (timestamp) => {
    if (!timestamp) return 'Невідомо';
    const date = new Date(timestamp);
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('uk-UA', timeOptions);
};

const redDotIcon = L.divIcon({
    className: 'custom-div-icon', 
    html: '<div style="background-color: red; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
    iconSize: [10, 10], 
    iconAnchor: [5, 5] 
});

// Іконки для симульованих ТЗ
const getVehicleIcon = (type) => {
    let color = type === 0 ? 'red' : type === 400 ? 'blue' : 'green'; 
    let iconHtml = type === 0 ? '🚃' : type === 400 ? '🚌' : '🚍';

    return L.divIcon({
        className: 'vehicle-icon', 
        html: `<div style="font-size: 18px; color: ${color};">${iconHtml}</div>`,
        iconSize: [20, 20], 
        iconAnchor: [10, 10] 
    });
};


const getRouteColor = (type) => {
    switch (type) {
        case 0: return 'red'; 
        case 400: return 'blue'; 
        case 3: return 'green'; 
        default: return 'gray';
    }
};

// Допоміжний компонент для оновлення центру мапи
const MapUpdater = ({ geometry, mapRef }) => {
    const map = useMap();

    useEffect(() => {
        if (geometry && geometry.length > 0) {
            const bounds = new L.LatLngBounds(geometry);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [geometry, map]);

    return null;
};

// =========================================================
// КОМПОНЕНТ ДЛЯ СИМУЛЯЦІЇ РУХУ
// =========================================================

const VehicleSimulator = React.memo(({ 
    routeType, 
    routeName, 
    routeGeometries, 
    vehiclesMap 
}) => {
    const [mockVehicles, setMockVehicles] = useState([]);
    
    const activeRouteEntry = useMemo(() => {
        return Object.values(vehiclesMap).find(v => v.name === routeName);
    }, [routeName, vehiclesMap]);
    
    const isMockable = activeRouteEntry && routeGeometries[activeRouteEntry.id] && routeGeometries[activeRouteEntry.id].length > 1;

    useEffect(() => {
        if (!routeName || !isMockable) {
            setMockVehicles([]);
            return;
        }

        const SIM_INTERVAL_MS = 100; 

        const interval = setInterval(() => {
            const allUpdatedVehicles = getMockVehicles(routeGeometries, vehiclesMap);
            const filtered = allUpdatedVehicles.filter(v => v.name === routeName);

            setMockVehicles(filtered);
        }, SIM_INTERVAL_MS);

        return () => {
            clearInterval(interval);
            setMockVehicles([]); 
        };
        
    }, [routeName, isMockable, routeGeometries, vehiclesMap]); 

    if (!routeName) {
        return (
            <Box 
                sx={{
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    zIndex: 1000, 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    padding: '8px 12px', 
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>
                    Симуляція: **Активована для всіх маршрутів з геометрією**.
                </p>
                <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>
                    Виберіть будь-який маршрут, щоб побачити рух.
                </p>
            </Box>
        );
    }
    
    if (!isMockable) {
         return (
             <Box 
                sx={{
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    zIndex: 1000, 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    padding: '8px 12px', 
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                <p style={{ margin: 0, fontSize: '0.9em', color: 'red', fontWeight: 'bold' }}>
                    Симуляція: **Геометрія відсутня** для №{routeName}.
                </p>
                <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>
                    Неможливо відобразити рух.
                </p>
            </Box>
        );
    }

    if (mockVehicles.length === 0) {
        return null;
    }

    return (
        <>
            {mockVehicles.map(v => {
                const icon = getVehicleIcon(v.type); 

                return (
                    <Marker key={v.id} position={[v.lat, v.lng]} icon={icon}>
                        <Popup>
                            <strong>Симуляція: № {v.name}</strong><br />
                            <small>Швидкість: {v.speed} км/год</small>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
});
// =========================================================


export default function DynamicMap({ 
    selectedRouteGeometry, 
    selectedRouteStops, 
    allStops, 
    selectedRouteType, 
    liveArrivals,
    selectedRouteName,
    routeGeometries, 
    vehiclesMap,  
    simulationEnabled  
}) {

    const mapRef = useRef(null);
    
    const routeStops = useMemo(() => {
        if (!selectedRouteStops) return [];
        return selectedRouteStops
            .map(stopId => allStops[stopId])
            .filter(stop => stop); 
    }, [selectedRouteStops, allStops]);

    const effectiveLiveArrivals = liveArrivals || {};

    const center = [49.84, 24.03]; 
    const zoom = 13;

    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Відображення симульованих ТЗ */}
            {simulationEnabled && (
            <VehicleSimulator 
            routeType={selectedRouteType}
            routeName={selectedRouteName}
            routeGeometries={routeGeometries}
            vehiclesMap={vehiclesMap}
            />
            )}

            {/* Відображення геометрії маршруту */}
            {selectedRouteGeometry && selectedRouteGeometry.length > 0 && (
                <Polyline 
                    positions={selectedRouteGeometry} 
                    color={getRouteColor(selectedRouteType)} 
                    weight={5} 
                    opacity={0.7} 
                />
            )}

            {/* Відображення зупинок маршруту */}
            {routeStops.map((stop, index) => {
                const arrivals = effectiveLiveArrivals[stop.id] || [];
                
                arrivals.sort((a, b) => a.arrivalTimeMs - b.arrivalTimeMs);

                return (
                    <Marker 
                        key={index} 
                        position={[stop.lat, stop.lng]} 
                        icon={redDotIcon} 
                    >
                        <Popup>
                            <strong>{stop.name}</strong>
                            {arrivals.length > 0 ? (
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px', listStyleType: 'disc' }}>
                                    {arrivals.map((arr, i) => (
                                        <li key={i}>
                                            № {arr.routeId}: <strong>{formatArrivalTime(arr.arrivalTimeMs)}</strong>
                                            {' '} ({arr.isSchedule ? 'План' : 'Live'}) {/* <--- ЦЕЙ РЯДОК БУВ ВИПРАВЛЕНИЙ */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ margin: '5px 0 0 0', color: 'gray' }}>
                                    Інформація про прибуття недоступна.
                                </p>
                            )}
                        </Popup>
                    </Marker>
                );
            })}

            <MapUpdater geometry={selectedRouteGeometry} mapRef={mapRef} />

        </MapContainer>
    );
}