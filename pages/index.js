import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useState, useMemo } from 'react';
import { query } from '../lib/db'; 

const DynamicMap = dynamic(
    () => import('../components/map'),
    { ssr: false }
);

const toMinutes = t => {
    if (!t) return -1;
    const parts = t.split(':').map(Number);
    return parts[0] * 60 + parts[1]; 
};

// ===============================
// SERVER SIDE PROPS (ЛОГІКА З БД)
// ===============================
export async function getServerSideProps() {
    try {
        // ----------------------------------------------------
        // 1. Отримання Routes
        // ----------------------------------------------------
        const rawVehicles = await query(
            `SELECT route_id AS id, route_short_name AS name, route_long_name AS longName, route_type AS type FROM routes`
        );
        
        const vehicles = rawVehicles.map(v => {
            let routeType = parseInt(v.type || '3', 10);
            const prefix = (v.name || '').toLowerCase();
            if (prefix.startsWith('тр') || routeType === 400) routeType = 400; // Тролейбус
            else if (routeType === 0 || prefix.startsWith('т')) routeType = 0; // Трамвай
            else routeType = 3; // Автобус
            
            return { ...v, type: routeType };
        });


        // ----------------------------------------------------
        // 2. Отримання Trips (для map та shape)
        // ----------------------------------------------------
        const rawTrips = await query(
            `SELECT trip_id, route_id, shape_id FROM trips WHERE shape_id IS NOT NULL`
        );
        
        const tripToRouteMap = {};
        const routeIdToShapeMap = {};
        
        rawTrips.forEach(trip => {
            tripToRouteMap[trip.trip_id] = trip.route_id;
            if (trip.route_id && trip.shape_id && !routeIdToShapeMap[trip.route_id]) {
                routeIdToShapeMap[trip.route_id] = trip.shape_id;
            }
        });

        // ----------------------------------------------------
        // 3. Отримання Shapes (Геометрія)
        // ----------------------------------------------------
        const rawShapes = await query(
            `SELECT shape_id, shape_pt_lat, shape_pt_lon FROM shapes ORDER BY shape_pt_sequence`
        );
        
        const allShapes = {};
        rawShapes.forEach(pt => {
            const lat = parseFloat(pt.shape_pt_lat);
            const lng = parseFloat(pt.shape_pt_lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                if (!allShapes[pt.shape_id]) allShapes[pt.shape_id] = [];
                allShapes[pt.shape_id].push([lat, lng]);
            }
        });


        // ----------------------------------------------------
        // 4. Отримання Stops (Зупинки)
        // ----------------------------------------------------
        const rawStops = await query(
            `SELECT stop_id, stop_name AS name, stop_lat AS lat, stop_lon AS lng FROM stops`
        );
        
        const allStops = {};
        rawStops.forEach(s => {
            const lat = parseFloat(s.lat);
            const lng = parseFloat(s.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                allStops[s.stop_id] = { id: s.stop_id, name: s.name, lat, lng };
            }
        });


        // ----------------------------------------------------
        // 5. Отримання Stop Times (Розклад) - ВИПРАВЛЕННЯ SQL IN
        // ----------------------------------------------------
        
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const tripIds = Object.keys(tripToRouteMap);
        let rawStopTimes = [];

        if (tripIds.length > 0) {
            const placeholders = tripIds.map(() => '?').join(', ');

            rawStopTimes = await query(
                `SELECT trip_id, arrival_time, stop_id FROM stop_times WHERE arrival_time IS NOT NULL AND trip_id IN (${placeholders})`,
                tripIds 
            );
        }

        const routeStopIds = {};
        const scheduledArrivals = {};
        
        rawStopTimes.forEach(parts => {
            const tripId = parts.trip_id;
            const arrival = parts.arrival_time;
            const stopId = parts.stop_id;

            const routeId = tripToRouteMap[tripId];
            if (!routeId) return;

            if (!routeStopIds[routeId]) routeStopIds[routeId] = new Set();
            routeStopIds[routeId].add(stopId);

            const arrMin = toMinutes(arrival);
            const diff = arrMin - nowMinutes;
            
            // Фільтрація
            if (diff < -5 && arrMin < 1440 - 360) return;
            if (diff > 360) return;

            if (!scheduledArrivals[stopId]) scheduledArrivals[stopId] = [];

            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setMinutes(arrMin);

            scheduledArrivals[stopId].push({
                routeId,
                arrivalTimeMs: date.getTime(),
                isSchedule: true
            });
        });

        const flatStops = {};
        Object.keys(routeStopIds).forEach(r =>
            flatStops[r] = Array.from(routeStopIds[r])
        );

        let liveArrivals = { ...scheduledArrivals };


        // ----------------------------------------------------
        // 6. LIVE GTFS (БЕЗ ЗМІН)
        // ----------------------------------------------------
        
        let gtfs;
        try {
            const module = await import('gtfs-realtime-bindings');
            gtfs = module.transit_realtime.FeedMessage;
        } catch {
            gtfs = null;
        }

        if (gtfs) {
            const url = 'https://opendata.city-adm.lviv.ua/GTFS_RT_data/trip_updates.pb';
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);

                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    const feed = gtfs.decode(new Uint8Array(buf));

                    feed.entity.forEach(ent => {
                        if (!ent.tripUpdate) return;

                        const routeId = ent.tripUpdate.trip.routeId;
                        ent.tripUpdate.stopTimeUpdate.forEach(up => {
                            const stopId = up.stopId;
                            const t = (up.arrival?.time?.low || up.departure?.time?.low) * 1000;

                            if (!t) return;

                            if (!liveArrivals[stopId]) liveArrivals[stopId] = [];

                            liveArrivals[stopId] = liveArrivals[stopId]
                                .filter(x => !(x.routeId === routeId && x.isSchedule));

                            liveArrivals[stopId].push({
                                routeId,
                                arrivalTimeMs: t,
                                isSchedule: false
                            });
                        });
                    });

                    Object.keys(liveArrivals).forEach(stopId => {
                        liveArrivals[stopId].sort((a, b) => a.arrivalTimeMs - b.arrivalTimeMs);
                        liveArrivals[stopId] = liveArrivals[stopId].slice(0, 10);
                    });
                }
            } catch (e) {
                console.warn("Live data error (Timeout/Fetch failed):", e.message);
            }
        }
        
        
        // ----------------------------------------------------
        // 7. Фінальна обробка (Геометрії + Сортування)
        // ----------------------------------------------------
        
        const routeGeometries = {};
        const vehiclesWithGeom = vehicles 
            .map(v => {
                const shapeId = routeIdToShapeMap[v.id];
                const g = allShapes[shapeId];
                if (!g) return null;
                routeGeometries[v.id] = g;
                return v;
            })
            .filter(Boolean)
            .sort((a, b) => {
                const typeOrder = { 0: 1, 400: 2, 3: 3 };
                const typeA = typeOrder[a.type] || 99;
                const typeB = typeOrder[b.type] || 99;
                if (typeA !== typeB) return typeA - typeB;
                return a.name.localeCompare(b.name, 'uk', { numeric: true });
            });

        const vehiclesMap = vehiclesWithGeom.reduce((acc, v) => {
            acc[v.id] = v;
            return acc;
        }, {});
        

        return {
            props: {
                initialVehicles: vehiclesWithGeom,
                routeGeometries,
                routeStopIds: flatStops, 
                allStops,
                liveArrivals,
                vehiclesMap, 
                error: null
            }
        };
    } catch (e) {
        console.error("Critical Server Error:", e);
        return {
            props: {
                initialVehicles: [],
                routeGeometries: {},
                routeStopIds: {},
                allStops: {},
                liveArrivals: {},
                vehiclesMap: {},
                error: `Критична помилка сервера: Не вдалося підключитися до БД або виконати запит. (${e.message})`
            }
        };
    }
}


// ===============================
// UI HELPERS (Без змін)
// ===============================

const getTypeLabel = (type) => {
    switch (type) {
        case 0: return 'Трамвай';
        case 400: return 'Тролейбус';
        case 3: return 'Автобус';
        default: return 'Інше';
    }
};

// ===============================
// MAIN COMPONENT (Без змін)
// ===============================

export default function HomePage({
    initialVehicles,
    routeGeometries,
    routeStopIds,
    allStops,
    liveArrivals,
    vehiclesMap, 
    error
}) {

    const [activeRouteId, setActiveRouteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [simulationEnabled, setSimulationEnabled] = useState(false);

    const handleSelectRoute = (routeId) => {
        setActiveRouteId(prev => (prev === routeId ? null : routeId));
    };

    const filteredVehicles = useMemo(() => {
        return initialVehicles.filter(v => {
            const typeMatch = filterType === 'all' || v.type === parseInt(filterType);
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = v.name.toLowerCase().includes(searchLower) ||
                                 (v.longName || '').toLowerCase().includes(searchLower) ||
                                 getTypeLabel(v.type).toLowerCase().includes(searchLower);
            return typeMatch && searchMatch;
        });
    }, [initialVehicles, searchTerm, filterType]);

    // Підготовка пропсів для мапи
    const selectedRouteGeometry = activeRouteId ? routeGeometries[activeRouteId] : null;
    const selectedRouteStops = activeRouteId ? routeStopIds[activeRouteId] : null;
    const selectedRouteType = activeRouteId ? initialVehicles.find(v => v.id === activeRouteId)?.type : null;
    const selectedRouteName = activeRouteId ? initialVehicles.find(v => v.id === activeRouteId)?.name : null;

    if (error) {
        return <div style={{padding: '20px', color: 'red'}}>Помилка: {error}</div>;
    }

    return (
        // Видалено зайві текстові вузли, якщо вони тут були
        <div className="root-wrapper">
            <Head>
                <title>SwiftRoute - Львів</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            </Head>

            <div className="container">
                <div className="sidebar">
                    <h2>🗺️ SwiftRoute</h2>
                    
                    <div className="controls">
                        {/* Пошук */}
                        <input
                            type="text"
                            placeholder="Пошук за № або назвою..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        
                        {/* Фільтр */}
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

                        {/* Кнопка Симуляції */}
                        <button 
                            className={`sim-btn ${simulationEnabled ? 'active' : ''}`}
                            onClick={() => setSimulationEnabled(p => !p)}
                        >
                            {simulationEnabled ? '⏹ Вимкнути Симуляцію' : '▶ Увімкнути Симуляцію'}
                        </button>
                    </div>

                    <div className="list-content">
                        {filteredVehicles.map(v => (
                            <div 
                                key={v.id} 
                                onClick={() => handleSelectRoute(v.id)}
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
                </div>

                <div className="map-area">
                    <DynamicMap 
                        key="main-map"
                        selectedRouteGeometry={selectedRouteGeometry} 
                        selectedRouteStops={selectedRouteStops} 
                        allStops={allStops} 
                        selectedRouteType={selectedRouteType}
                        selectedRouteName={selectedRouteName}
                        liveArrivals={liveArrivals}
                        routeGeometries={routeGeometries}
                        vehiclesMap={vehiclesMap}
                        simulationEnabled={simulationEnabled}
                    />
                </div>
            </div>

            <style jsx global>{`
                html, body, #__next {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    overflow: hidden; /* <--- ЦЕ БЛОКУЄ ПРОКРУТКУ ВСІЄЇ СТОРІНКИ */
                }
                .root-wrapper {
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                }
                .container {
                    display: flex;
                    height: 100%;
                    width: 100%;
                    background-color: transparent;
                }
                .sidebar {
                    width: 320px;
                    height: 100%;
                    border-right: 1px solid #ccc;
                    padding-top: 10px;
                    background-color: #f8f8f8;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0; /* Забороняємо стискання сайдбару */
                    z-index: 1000;
                }
                .sidebar h2 {
                    text-align: center;
                    margin: 0 0 10px 0;
                    color: #333;
                    flex-shrink: 0;
                }
                .controls {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    background: #fff;
                    margin-bottom: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    flex-shrink: 0; /* Панель управління не стискається */
                }
                .list-content {
                    flex-grow: 1; /* Займає весь доступний простір */
                    overflow-y: auto; /* <--- СКРОЛ ТІЛЬКИ ТУТ (СПИСОК) */
                    padding: 0 10px;
                }
                .map-area {
                    flex-grow: 1;
                    height: 100%;
                    position: relative;
                }
                .controls input, .controls select {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .sim-btn {
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    cursor: pointer;
                    background-color: #4caf50;
                    color: white;
                    transition: background 0.3s;
                }
                .sim-btn.active {
                    background-color: #d32f2f;
                }
                .sim-btn:hover {
                    opacity: 0.9;
                }
            `}</style>
        </div>
    );
}