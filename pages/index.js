import * as fs from 'fs';
import * as path from 'path';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useState, useMemo } from 'react'; 


const DynamicMap = dynamic(
    () => import('../components/map.jsx'), 
    { ssr: false }
);


function parseCSV(content) {
    const lines = content.trim().split('\n');
    return lines.slice(1).map(line => {
        return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(part => 
            (part || '').trim().replace(/"/g, '')
        );
    });
}

function parseRoutes(content) {
    const data = parseCSV(content);
    const vehicles = []; 
    
    data.forEach(parts => {
        if (parts.length >= 7) { 
            const routeId = parts[0];
            const shortName = parts[2];
            const longName = parts[3]; 
            let routeType = parseInt(parts[5]); 

            const namePrefix = shortName.toLowerCase().trim();

            if (namePrefix.startsWith('тр') || namePrefix.startsWith('tr')) { 
                routeType = 400; 
            } 
            else if (routeType !== 0) {
                routeType = 3; 
            }

            if (routeId && shortName) {
                vehicles.push({ 
                    id: routeId, 
                    name: shortName,
                    longName: longName, 
                    type: routeType 
                }); 
            }
        }
    });
    return { vehicles }; 
}

function parseTrips(content) {
    const data = parseCSV(content);
    const tripToRouteMap = {};
    const routeIdToShapeMap = {}; 
    
    data.forEach(parts => {
        if (parts.length >= 7) { 
            const routeId = parts[0];
            const serviceId = parts[1];
            const tripId = parts[2];
            const shapeId = parts[6];
            
            if (routeId && tripId) {
                tripToRouteMap[tripId] = routeId;
            }
            if (routeId && shapeId && !routeIdToShapeMap[routeId]) {
                routeIdToShapeMap[routeId] = shapeId;
            }
        }
    });
    return { tripToRouteMap, routeIdToShapeMap };
}

function parseShapes(content) {
    const data = parseCSV(content);
    const allShapes = {}; 
    
    data.forEach(parts => {
        if (parts.length >= 3) {
            const shapeId = parts[0]; 
            const lat = parseFloat(parts[1]); 
            const lng = parseFloat(parts[2]); 
            
            if (shapeId && !isNaN(lat) && !isNaN(lng)) {
                if (!allShapes[shapeId]) {
                    allShapes[shapeId] = [];
                }
                allShapes[shapeId].push({ lat, lng });
            }
        }
    });
    return allShapes;
}

function parseStops(content) {
    const data = parseCSV(content);
    const stops = {}; 
    
    data.forEach(parts => {
        if (parts.length >= 6) { 
            const stopId = parts[0];
            const name = parts[2];   
            const lat = parseFloat(parts[4]); 
            const lng = parseFloat(parts[5]); 
            
            if (stopId && name && !isNaN(lat) && !isNaN(lng)) {
                stops[stopId] = { id: stopId, lat, lng, name };
            }
        }
    });
    return stops; 
}

function parseStopTimes(content) {
    const data = parseCSV(content);
    const tripIdToStopIds = {};
    
    data.forEach(parts => {
        if (parts.length >= 4) {
            const tripId = parts[0];
            const arrivalTime = parts[1]; 
            const stopId = parts[3];
            
            if (tripId && stopId) {
                if (!tripIdToStopIds[tripId]) {
                    tripIdToStopIds[tripId] = []; 
                }
                if (!tripIdToStopIds[tripId].includes(stopId)) {
                   tripIdToStopIds[tripId].push(stopId);
                }
            }
        }
    });
    return tripIdToStopIds;
}

export async function getServerSideProps() {
    const dataDir = path.join(process.cwd(), 'data'); 
    
    const LIVE_FEED_URL = 'https://opendata.city-adm.lviv.ua/GTFS_RT_data/trip_updates.pb';
    
    const liveArrivals = {};
    let GtfsRt;
    try {
        
        const routesContent = fs.readFileSync(path.join(dataDir, 'routes.txt'), 'utf-8');
        const tripsContent = fs.readFileSync(path.join(dataDir, 'trips.txt'), 'utf-8');
        const shapesContent = fs.readFileSync(path.join(dataDir, 'shapes.txt'), 'utf-8');
        const stopsContent = fs.readFileSync(path.join(dataDir, 'stops.txt'), 'utf-8');
        const stopTimesContent = fs.readFileSync(path.join(dataDir, 'stop_times.txt'), 'utf-8');
        
        const { vehicles: rawVehicles } = parseRoutes(routesContent);
        const { tripToRouteMap, routeIdToShapeMap } = parseTrips(tripsContent);
        const allShapes = parseShapes(shapesContent);
        const allStops = parseStops(stopsContent);
        const tripIdToStopIds = parseStopTimes(stopTimesContent);

        const routeGeometries = {};
        const routeStopIds = {};
        const plannedArrivals = {}; 

        
        Object.entries(tripToRouteMap).forEach(([tripId, routeId]) => {
            const stopIdsForTrip = tripIdToStopIds[tripId];
            if (stopIdsForTrip) {
                if (!routeStopIds[routeId]) {
                    routeStopIds[routeId] = []; 
                }
                stopIdsForTrip.forEach(stopId => {
                    if (!routeStopIds[routeId].includes(stopId)) {
                        routeStopIds[routeId].push(stopId);
                    }
                });
            }
        });

        const initialVehicles = rawVehicles
        .map(vehicle => {
            const shapeId = routeIdToShapeMap[vehicle.id]; 
        
            if (vehicle.id && allShapes[shapeId]) {
                routeGeometries[vehicle.id] = allShapes[shapeId]; 
                routeStopIds[vehicle.id] = Array.from(routeStopIds[vehicle.id] || []); 
                return vehicle;
            }
            return null; 
        })
            .filter(v => v !== null)
            .sort((a, b) => { 
                const typeOrder = { 0: 1, 400: 2, 3: 3 }; 
                const typeA = typeOrder[a.type] || 99;
                const typeB = typeOrder[b.type] || 99;
                if (typeA !== typeB) return typeA - typeB;
                return a.name.localeCompare(b.name, 'uk', { numeric: true });
            });


    let GtfsRt;
    try {
        const { GtfsRt: GtfsRtModule } = require('gtfs-rt-bindings');
        GtfsRt = GtfsRtModule; 
    } catch (e) {
        console.error("Критична помилка імпорту 'gtfs-rt-bindings'. Переконайтеся, що бібліотека встановлена:", e.message);
    }
    
    const LIVE_FEED_URL = 'https://opendata.city-adm.lviv.ua/GTFS_RT_data/trip_updates.pb';
    
    const liveArrivals = {};


    if (GtfsRt) { 
        try {
            const rtResponse = await fetch(LIVE_FEED_URL);
            
            if (!rtResponse.ok) {
                throw new Error(`Помилка HTTP: ${rtResponse.status}`);
            }
            
            const buffer = await rtResponse.arrayBuffer(); 
            
            const feed = GtfsRt.decode(new Uint8Array(buffer)); 

            feed.entity.forEach(entity => {
                if (entity.tripUpdate) {
                    const routeId = entity.tripUpdate.trip.routeId;
                    
                    entity.tripUpdate.stopTimeUpdate.forEach(stopUpdate => {
                        const stopId = stopUpdate.stopId;
                        const arrivalTimeMs = stopUpdate.arrival?.time?.low * 1000; 

                        if (stopId && arrivalTimeMs) {
                            if (!liveArrivals[stopId]) {
                                liveArrivals[stopId] = [];
                            }
                            
                            liveArrivals[stopId].push({
                                routeId: routeId,
                                arrivalTimeMs: arrivalTimeMs 
                            });
                        }
                    });
                }
            });

        } catch (rtError) {
            console.warn("Не вдалося завантажити/обробити Live-дані (GTFS-RT).", rtError.message); 
        }
    } 
    
    return {
        props: {
            initialVehicles: initialVehicles,
            routeGeometries: routeGeometries,
            routeStopIds: routeStopIds,
            allStops: allStops,
            plannedArrivals: plannedArrivals, 
        },
    };
    } catch (error) {
        console.error("Критична помилка сервера під час обробки статичних даних:", error.message);
        return {
            props: {
                initialVehicles: [],
                routeGeometries: {},
                routeStopIds: {},
                allStops: {},
                liveArrivals: {}, 
                error: `Не вдалося завантажити дані. Помилка: ${error.message}`
            },
        };
    }
}


const getTypeLabel = (type) => {
    switch (type) {
        case 0: return 'Трамвай';
        case 400: return 'Тролейбус';
        case 3: return 'Автобус';
        default: return 'Інше';
    }
};

const SidebarContent = ({ vehicles, onSelectRoute, activeRouteId }) => {
    return (
        <div style={{ padding: '0 10px' }}>
            {vehicles.map(v => (
                <div 
                    key={v.id} 
                    onClick={() => onSelectRoute(v.id)}
                    style={{ 
                        cursor: 'pointer', 
                        padding: '8px', 
                        backgroundColor: v.id === activeRouteId ? '#e0f7fa' : 'transparent',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <span style={{ 
                        marginRight: '8px', 
                        fontSize: '1.2em', 
                        color: v.type === 0 ? 'red' : v.type === 400 ? 'blue' : 'green' 
                    }}>
                        {v.type === 0 ? '🚃' : v.type === 400 ? '🚌' : '🚍'}
                    </span>
                    <div>
                        <strong>№ {v.name}</strong> ({getTypeLabel(v.type)})
                        <div style={{ fontSize: '0.9em', color: '#555', marginTop: '3px' }}>
                            {v.longName}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default function HomePage({ initialVehicles, routeGeometries, routeStopIds, allStops, error, liveArrivals }) {
    
    const [activeRouteId, setActiveRouteId] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); 

    const handleSelectRoute = (routeId) => {
        setActiveRouteId(prev => (prev === routeId ? null : routeId));
    };

    const filteredVehicles = useMemo(() => {
        return initialVehicles.filter(v => {
            const typeMatch = filterType === 'all' || v.type === parseInt(filterType);
            
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = v.name.toLowerCase().includes(searchLower) ||
                                v.longName.toLowerCase().includes(searchLower) ||
                                getTypeLabel(v.type).toLowerCase().includes(searchLower);

            return typeMatch && searchMatch;
        });
    }, [initialVehicles, searchTerm, filterType]);

    const selectedRouteGeometry = activeRouteId 
        ? routeGeometries[activeRouteId] 
        : null;

    const selectedRouteStops = activeRouteId
        ? routeStopIds[activeRouteId]
        : null;

    const selectedRouteType = activeRouteId
        ? initialVehicles.find(v => v.id === activeRouteId)?.type
        : null;
        
    if (error) {
        return <div style={{padding: '20px', color: 'red'}}>Помилка: {error}</div>;
    }

    return (
        <div>
            <Head>
                <title>Транспортна Мапа Львова</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            </Head>
            <div className="container">
                <div className="sidebar">
                    <h2>🗺️ SwiftRoute</h2>
                    
                    <div className="controls">
                        <input
                            type="text"
                            placeholder="Пошук за № або назвою..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select 
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setActiveRouteId(null); 
                            }}
                        >
                            <option value="all">Усі види</option>
                            <option value="0">Трамваї</option>
                            <option value="400">Тролейбуси</option>
                            <option value="3">Автобуси</option>
                        </select>
                    </div>

                    <SidebarContent 
                        vehicles={filteredVehicles}
                        onSelectRoute={handleSelectRoute}
                        activeRouteId={activeRouteId}
                    />
                </div>
                <div className="map-area">
                    <DynamicMap 
                        key={activeRouteId} 
                        selectedRouteGeometry={selectedRouteGeometry} 
                        selectedRouteStops={selectedRouteStops} 
                        allStops={allStops} 
                        selectedRouteType={selectedRouteType} 
                        liveArrivals={liveArrivals}
                    />
                </div>
            </div>

            <style jsx global>{`
                html, body, #__next {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }
                .container {
                    display: flex;
                    height: 100vh;
                    background-color: transparent;
                }
                .sidebar {
                    width: 300px;
                    overflow-y: auto;
                    border-right: 1px solid #ccc;
                    padding-top: 10px;
                    background-color: #f8f8f8;
                }
                .map-area {
                    flex-grow: 1;
                    min-height: 100%;
                }
                .controls {
                    padding: 10px;
                    border-bottom: 1px solid #ffffffff;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .controls input, .controls select {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}