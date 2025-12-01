// components/map.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet'; 

// 🛑 Визначаємо простий круговий маркер (червона крапка)
const simpleStopIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color: #d9534f; width: 8px; height: 8px; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 2px rgba(0,0,0,0.5);'></div>",
    iconSize: [8, 8], 
    iconAnchor: [4, 4] 
});

// ❗️ ВАЖЛИВО: Перевизначаємо стандартний маркер нашої простою іконкою
L.Marker.prototype.options.icon = simpleStopIcon;


// Компонент для керування картою (переміщення та відображення)
const MapController = ({ selectedRouteGeometry, allStops }) => {
    const map = useMap();
    
    // 1. АВТОМАТИЧНЕ ЦЕНТРУВАННЯ НА МАРШРУТІ
    useEffect(() => {
        if (selectedRouteGeometry && selectedRouteGeometry.length > 0) {
            // Отримання меж маршруту
            const bounds = L.latLngBounds(selectedRouteGeometry.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (Object.keys(allStops).length > 0) {
             // Центрування на першій зупинці, якщо маршрут не вибрано
             const firstStop = Object.values(allStops)[0];
             map.setView([firstStop.lat, firstStop.lng], 13);
        } else {
            // Центрування на Львові, якщо даних немає
             map.setView([49.8397, 24.0297], 13); 
        }
    }, [selectedRouteGeometry, map, allStops]);


    // 2. ВІДОБРАЖЕННЯ ЗУПИНОК ТА ЛІНІЇ
    
    // Оптимізований список зупинок для рендерингу
    const stopMarkers = useMemo(() => 
        Object.values(allStops).map(stop => (
            <Marker 
                key={stop.id} 
                position={[stop.lat, stop.lng]}
                // Використовуємо просту іконку, визначену вище
                icon={simpleStopIcon} 
            >
                <Popup>{stop.name}</Popup>
            </Marker>
        ))
    , [allStops]);
    
    // Форматування геометрії для Polyline
    const lineCoordinates = selectedRouteGeometry 
        ? selectedRouteGeometry.map(p => [p.lat, p.lng]) 
        : [];

    return (
        <>
            {/* Відображення маршрутної лінії */}
            {lineCoordinates.length > 0 && (
                <Polyline 
                    positions={lineCoordinates} 
                    color="#2087e5" 
                    weight={5} 
                    opacity={0.8}
                />
            )}
            
            {/* Відображення зупинок, тільки якщо не вибрано маршрут (для чистоти) 
               Якщо Вам потрібно відображати зупинки завжди, залиште це.
               Я залишаю відображення всіх зупинок, щоб Ви бачили, що вони працюють. 
            */}
             {stopMarkers}

        </>
    );
};


// Основний компонент карти
const Map = ({ selectedRouteGeometry, allStops }) => {
    
    // Центрування карти на Львів
    const defaultCenter = [49.8397, 24.0297];

    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Підключення керуючого компонента */}
            <MapController 
                selectedRouteGeometry={selectedRouteGeometry} 
                allStops={allStops}
            />
            
        </MapContainer>
    );
};

export default Map;