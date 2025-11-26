// utils/mockVehicleSimulator.js

// 🚨 Важливо: Тут мають бути всі точки з shape_id 5! Я включаю лише перші 9.
const shape5Data = [
    { lat: 49.82202, lng: 23.93662 },
    { lat: 49.82219, lng: 23.93651 },
    { lat: 49.824, lng: 23.93804 },
    { lat: 49.82438, lng: 23.93839 },
    { lat: 49.82464, lng: 23.93885 },
    { lat: 49.82488, lng: 23.93937 },
    { lat: 49.82503, lng: 23.9397 },
    { lat: 49.82535, lng: 23.94072 },
    { lat: 49.82576, lng: 23.94282 },
];

const ROUTE_SHAPES = {
    '88': { shapeId: 5, data: shape5Data }, 
    '90': { shapeId: 5, data: shape5Data }, 
    '94': { shapeId: 5, data: shape5Data }, 
};

const vehiclePositions = {};

function interpolatePosition(start, end, progress) {
    const lat = start.lat + (end.lat - start.lat) * progress;
    const lng = start.lng + (end.lng - start.lng) * progress;
    return { lat, lng };
}

export function getMockVehicles() {
    const activeRoutes = Object.keys(ROUTE_SHAPES);
    const mockVehicles = [];
    const TIME_STEP = 0.005; 
    const MAX_VEHICLES_PER_ROUTE = 3; 

    activeRoutes.forEach(routeId => {
        const routeInfo = ROUTE_SHAPES[routeId];
        const shape = routeInfo.data;

        for (let i = 0; i < MAX_VEHICLES_PER_ROUTE; i++) {
            const vehicleKey = `${routeId}-${i}`;

            if (!vehiclePositions[vehicleKey]) {
                vehiclePositions[vehicleKey] = {
                    currentSegment: 0,
                    progress: i / MAX_VEHICLES_PER_ROUTE, 
                    speed: 30,
                };
            }

            const state = vehiclePositions[vehicleKey];
            state.progress += TIME_STEP;

            if (state.currentSegment >= shape.length - 2) {
                state.currentSegment = 0;
                state.progress = 0;
            }

            let startPoint = shape[state.currentSegment];
            let endPoint = shape[state.currentSegment + 1];

            if (state.progress >= 1.0) {
                state.currentSegment += 1;
                state.progress = 0;
                startPoint = shape[state.currentSegment];
                endPoint = shape[state.currentSegment + 1];
            }

            if (startPoint && endPoint) {
                const { lat, lng } = interpolatePosition(startPoint, endPoint, state.progress);
                
                mockVehicles.push({
                    id: vehicleKey, 
                    routeId: routeId,
                    lat: lat,
                    lng: lng,
                    speed: state.speed,
                    numberPlate: routeId, 
                });
            }
        }
    });

    return mockVehicles;
}