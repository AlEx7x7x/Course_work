// utils/mockVehicleSimulator.js

// Глобальний стан для збереження позицій ТЗ між викликами
const vehiclePositions = {};
const MAX_VEHICLES_PER_ROUTE = 3; 
const TIME_STEP = 0.02; // Збільшено крок для прискорення руху (було 0.005)

// Виправлена функція інтерполяції
function interpolatePosition(start, end, progress) {
    const lat = start.lat + (end.lat - start.lat) * progress;
    const lng = start.lng + (end.lng - start.lng) * progress;
    return { lat, lng };
}

/**
 * Генерує симульовані позиції транспортних засобів для всіх маршрутів.
 * * @param {object} routeGeometries - Мапа GTFS Route ID до полілінії ([lat, lng] масив).
 * @param {object} vehiclesMap - Мапа GTFS Route ID до об'єкта маршруту (name, type).
 * @returns {Array} Масив об'єктів симульованих ТЗ.
 */
export function getMockVehicles(routeGeometries, vehiclesMap) {
    const activeRouteIds = Object.keys(routeGeometries);
    const mockVehicles = [];

    activeRouteIds.forEach(routeId => {
        const shape = routeGeometries[routeId];
        const routeInfo = vehiclesMap[routeId]; 

        // Перевірка на наявність даних
        if (!shape || shape.length < 2 || !routeInfo) {
            return;
        }

        // Використовуємо коротке ім'я маршруту (наприклад, '88') для ключа
        const routeName = routeInfo.name; 
        
        // Симулюємо MAX_VEHICLES_PER_ROUTE для кожного маршруту
        for (let i = 0; i < MAX_VEHICLES_PER_ROUTE; i++) {
            const vehicleKey = `${routeName}-SIM-${i}`; 

            // Ініціалізація стану
            if (!vehiclePositions[vehicleKey]) {
                const totalSegments = shape.length - 1;
                // Розраховуємо сегмент для старту, щоб розкидати ТЗ по всьому маршруту
                const segmentsPerVehicle = Math.floor(totalSegments / MAX_VEHICLES_PER_ROUTE);
                
                vehiclePositions[vehicleKey] = {
                    // Стартовий сегмент
                    currentSegment: Math.min(i * segmentsPerVehicle, totalSegments - 1), 
                    progress: 0, // Починаємо на початку сегмента
                    speed: 50, // Збільшено швидкість (було 30)
                };
            }

            const state = vehiclePositions[vehicleKey];
            state.progress += TIME_STEP;

            // Обробка переходу на наступний сегмент
            if (state.progress >= 1.0) {
                state.currentSegment += 1;
                state.progress = 0;
            }
            
            // Обробка кінця маршруту (циклічний рух)
            if (state.currentSegment >= shape.length - 1) { 
                state.currentSegment = 0;
                state.progress = 0;
            }

            // Точки GTFS: [lat, lng]
            const startPoint = shape[state.currentSegment];
            const endPoint = shape[state.currentSegment + 1];

            if (startPoint && endPoint) {
                // Конвертуємо [lat, lng] в {lat, lng} для функції interpolatePosition
                const start = { lat: startPoint[0], lng: startPoint[1] };
                const end = { lat: endPoint[0], lng: endPoint[1] };
                
                const { lat, lng } = interpolatePosition(start, end, state.progress);
                
                mockVehicles.push({
                    id: vehicleKey, 
                    routeId: routeId, 
                    name: routeName, 
                    lat: lat,
                    lng: lng,
                    speed: state.speed,
                    type: routeInfo.type, 
                });
            }
        }
    });

    return mockVehicles;
}