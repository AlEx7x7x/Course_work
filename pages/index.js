import * as fs from 'fs';
import * as path from 'path';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useState } from 'react'; 

const DynamicMap = dynamic(
    () => import('../components/map.jsx'), 
    { ssr: false }
);

// ----------------------------------------------------
// ⚙️ GTFS ПАРСЕРИ (ФІНАЛЬНА ВЕРСІЯ)
// ----------------------------------------------------

function parseRoutes(content) {
    const lines = content.trim().split('\n');
    const routeIdMap = {}; 
    const initialVehicles = []; 
    
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (parts.length >= 7) { 
            const routeIdRaw = parts[0] || '';
            const shortNameRaw = parts[2] || '';
            const longNameRaw = parts[3] || ''; 
            const routeTypeRaw = parts[5] || '';

            const routeId = routeIdRaw.trim().replace(/"/g, '');
            const shortName = shortNameRaw.trim().replace(/"/g, '');
            const longName = longNameRaw.trim().replace(/"/g, ''); 
            const routeType = parseInt(routeTypeRaw.trim().replace(/"/g, ''));
            
            if (routeId.length > 0 && shortName.length > 0) {
                routeIdMap[routeId] = shortName;
                initialVehicles.push({ 
                    id: routeId, 
                    name: shortName,
                    longName: longName, 
                    type: routeType
                }); 
            }
        }
    });
    return { vehicles: initialVehicles, routeIdMap }; 
}

// ФАЙЛ: trips.txt (Повертаємося до ІНДЕКСУ 3)
function parseTrips(content) {
    const lines = content.trim().split('\n');
    const routeIdToShapeMap = {}; 
    
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // Очікуємо мінімум 7 колонок для shape_id на індексі 6
        if (parts.length >= 7) { 
            const routeId = (parts[0] || '').trim().replace(/"/g, '');
            // 🛑 ОСТАТОЧНЕ ВИПРАВЛЕННЯ: ІНДЕКС 6
            const shapeId = (parts[6] || '').trim().replace(/"/g, ''); 
            
            if (routeId && shapeId && !routeIdToShapeMap[routeId]) {
                routeIdToShapeMap[routeId] = shapeId;
            }
        }
    });
    return routeIdToShapeMap;
}
// ФАЙЛ: shapes.txt (ВИКОРИСТОВУЄМО ІНДЕКСИ 1 ТА 2, які Ви підтвердили)
function parseShapes(content) {
    const lines = content.trim().split('\n');
    const allShapes = {}; 
    
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (parts.length >= 3) {
            const shapeId = (parts[0] || '').trim().replace(/"/g, ''); 
            const lat = parseFloat((parts[1] || '').trim().replace(/"/g, '')); // 1
            const lng = parseFloat((parts[2] || '').trim().replace(/"/g, '')); // 2
            
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

// ФАЙЛ: stops.txt (Використовуємо індекси 4 та 5, які Ви підтвердили)
function parseStops(content) {
    const lines = content.trim().split('\n');
    const stops = {}; 
    
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        
        if (parts.length >= 6) { 
            const stopId = (parts[0] || '').trim().replace(/"/g, '');
            const name = (parts[2] || '').trim().replace(/"/g, '');   
            const lat = parseFloat((parts[4] || '').trim().replace(/"/g, '')); 
            const lng = parseFloat((parts[5] || '').trim().replace(/"/g, '')); 
            
            if (stopId && name && !isNaN(lat) && !isNaN(lng)) {
                stops[stopId] = { id: stopId, lat, lng, name };
            }
        }
    });
    return stops; 
}


// ----------------------------------------------------
// 📦 getServerSideProps (Фінальна версія)
// ----------------------------------------------------

export async function getServerSideProps() {
    const dataDir = path.join(process.cwd(), 'data'); 
    
    try {
        const routesContent = fs.readFileSync(path.join(dataDir, 'routes.txt'), 'utf-8');
        const tripsContent = fs.readFileSync(path.join(dataDir, 'trips.txt'), 'utf-8');
        const shapesContent = fs.readFileSync(path.join(dataDir, 'shapes.txt'), 'utf-8');
        const stopsContent = fs.readFileSync(path.join(dataDir, 'stops.txt'), 'utf-8');
        
        const { vehicles: rawVehicles } = parseRoutes(routesContent);
        const routeIdToShapeMap = parseTrips(tripsContent);
        const allShapes = parseShapes(shapesContent);
        const allStops = parseStops(stopsContent);

        const initialVehicles = rawVehicles.sort((a, b) => {
            const typeOrder = { 0: 1, 400: 2, 3: 3 }; 
            const typeA = typeOrder[a.type] || 99;
            const typeB = typeOrder[b.type] || 99;
            if (typeA !== typeB) return typeA - typeB;
            return a.name.localeCompare(b.name, 'uk', { numeric: true });
        });

        const routeGeometries = {};
        initialVehicles.forEach(vehicle => {
            const routeShortName = vehicle.name;
            const numericRouteId = vehicle.id;

            // shapeId тепер може бути 5, 15, 16...
            const shapeId = routeIdToShapeMap[numericRouteId]; 
            
            if (routeShortName && allShapes[shapeId]) {
                routeGeometries[routeShortName] = allShapes[shapeId]; 
            }
        });

        return {
             props: {
                 initialVehicles: initialVehicles,
                 routeGeometries: routeGeometries,
                 allStops: allStops, 
             },
         };
    } catch (error) {
        console.error("Критична помилка сервера під час обробки даних:", error.message);
        return {
            props: {
                initialVehicles: [],
                routeGeometries: {},
                allStops: {},
                error: "Не вдалося завантажити транспортні дані."
            },
        };
    }
}


// ----------------------------------------------------
// 🗺️ КОМПОНЕНТИ КЛІЄНТА (Без змін)
// ----------------------------------------------------

const SidebarContent = ({ vehicles, onSelectRoute, activeRoute }) => {
    
    const getTypeLabel = (type) => {
        switch (type) {
            case 0: return 'Трамвай';
            case 400: return 'Тролейбус';
            case 3: return 'Автобус';
            default: return 'Інше';
        }
    };
    
    return (
        <div style={{ padding: '0 10px' }}>
            {vehicles.map(v => (
                <div 
                    key={v.id} 
                    onClick={() => onSelectRoute(v.name)}
                    style={{ 
                        cursor: 'pointer', 
                        padding: '8px', 
                        backgroundColor: v.name === activeRoute ? '#e0f7fa' : 'transparent',
                        borderBottom: '1px solid #eee'
                    }}
                >
                    <strong>№ {v.name}</strong> ({getTypeLabel(v.type)})
                    <div style={{ fontSize: '0.9em', color: '#555', marginTop: '3px' }}>
                        {v.longName}
                    </div>
                </div>
            ))}
        </div>
    );
};


export default function HomePage({ initialVehicles, routeGeometries, allStops, error }) {
    
    const [selectedRouteName, setSelectedRouteName] = useState(null);

    const handleSelectRoute = (routeName) => {
        setSelectedRouteName(prev => (prev === routeName ? null : routeName));
    };

    const selectedRouteGeometry = selectedRouteName 
        ? routeGeometries[selectedRouteName] 
        : null;

    if (error) {
        return <div style={{padding: '20px', color: 'red'}}>Помилка: {error}</div>;
    }

    return (
        <div>
            <Head>
                <title>Транспортна Мапа</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                      integrity="sha256-p4NxAoJBhIINfBMOe30JFEiDLhM97LqA48iZ61BfA5K4="
                      crossOrigin="" />
            </Head>
            <div className="container">
                <div className="sidebar">
                    <h2>🗺️ Маршрути</h2>
                    <SidebarContent 
                        vehicles={initialVehicles}
                        onSelectRoute={handleSelectRoute}
                        activeRoute={selectedRouteName}
                    />
                </div>
                <div className="map-area">
                    <DynamicMap 
                        key={selectedRouteName} // Примусове оновлення карти
                        selectedRouteGeometry={selectedRouteGeometry} 
                        allStops={allStops} 
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
                }
                .sidebar {
                    width: 300px;
                    overflow-y: auto;
                    border-right: 1px solid #ccc;
                    padding-top: 10px;
                }
                .map-area {
                    flex-grow: 1;
                    min-height: 100%;
                }
            `}</style>
        </div>
    );
}