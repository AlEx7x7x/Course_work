import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    });
}

const redDotIcon = L.divIcon({
    className: 'custom-div-icon', 
    html: '<div style="background-color: red; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
    iconSize: [10, 10], 
    iconAnchor: [5, 5] 
});


const getRouteColor = (type) => {
    switch (type) {
        case 0: return 'red'; // Трамвай
        case 400: return 'blue'; // Тролейбус
        case 3: return 'green'; // Автобус
        default: return 'gray';
    }
};

const MapUpdater = ({ geometry, mapRef }) => {
    const map = useMap();

    useEffect(() => {
        if (geometry && geometry.length > 0) {
            const bounds = L.latLngBounds(geometry.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [geometry, map]);

    return null;
};

const formatArrivalTime = (arrivalTimeMs) => {
    const now = Date.now();
    const diffMs = arrivalTimeMs - now;
    
    if (diffMs < 0) return 'Прибув';
    
    const minutes = Math.floor(diffMs / 60000);
    
    if (minutes === 0) return 'Зараз';
    
    return `${minutes} хв.`;
};


export default function DynamicMap({ 
    selectedRouteGeometry, 
    selectedRouteStops, 
    allStops, 
    selectedRouteType,
    liveArrivals 
}) {
    const defaultCenter = [49.842957, 24.031111]; 
    const defaultZoom = 13;
    const mapRef = useRef(null);
    const routeColor = getRouteColor(selectedRouteType);
    const effectiveLiveArrivals = liveArrivals && typeof liveArrivals === 'object' ? liveArrivals : {};

    const stopsToRender = selectedRouteStops && allStops
        ? selectedRouteStops
            .map(stopId => allStops[stopId]) 
            .filter(stop => stop && stop.lat && stop.lng)
        : [];
        
    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={defaultZoom} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: 'white' }}
            whenCreated={(map) => { mapRef.current = map; }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {selectedRouteGeometry && (
                <Polyline 
                    positions={selectedRouteGeometry.map(p => [p.lat, p.lng])} 
                    color={routeColor} 
                    weight={5} 
                />
            )}
            
            {stopsToRender.map((stop, index) => {
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