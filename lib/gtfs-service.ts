// lib/gtfs-service.ts

import { query } from './db'; 

// --- Інтерфейси для Типізації ---
interface ShapePoint {
    lat: number;
    lon: number;
    dist: number;
}

export interface RouteShape {
    tripId: string;
    headsign: string;
    shape: ShapePoint[];
}

export interface RouteListItem {
    id: string;
    name: string;
    longName: string;
    type: number;
}


/**
 * Отримує лише список маршрутів (це функція, яка генерує перший console.log).
 */
export async function getRouteList(): Promise<RouteListItem[]> {
    const sql = `
        SELECT
            route_id AS id,
            route_short_name AS name,
            route_long_name AS longName,
            route_type AS type
        FROM routes
        ORDER BY route_short_name
        LIMIT 5; -- Обмеження, щоб не виводити 72 маршрути в консоль
    `;
    
    // Console.log, який ви бачите у виводі
    console.log("==========================================");
    console.log(`✅ RAW VEHICLES (Дані з таблиці routes):`);
    
    const results = await query(sql);

    console.log(`Загальна кількість отриманих маршрутів: ${results.length}`);
    console.log("==========================================");

    return results as RouteListItem[];
}


/**
 * Отримує та групує географічні точки для всіх поїздок певного маршруту.
 * !!! ЦЕ ФУНКЦІЯ, ЯКУ ПОТРІБНО ВИПРАВИТИ !!!
 * Припустимо, ми тестуємо маршрут '100'
 */
export async function getRouteShapes(routeId: string = '100'): Promise<RouteShape[]> {
    const sql = `
        SELECT
            t.trip_id,
            t.trip_headsign,
            s.shape_pt_lat,
            s.shape_pt_lon,
            s.shape_dist_traveled
        FROM trips t
        -- *** КЛЮЧОВЕ ВИПРАВЛЕННЯ: ДОДАЄМО TRIM() ДЛЯ УМОВИ З'ЄДНАННЯ ***
        JOIN shapes s ON TRIM(t.shape_id) = TRIM(s.shape_id)
        WHERE t.route_id = ?
        ORDER BY t.trip_id, s.shape_pt_sequence;
    `;
    
    // Ми використовуємо змінну, але для тестування беремо '100'
    const results = await query(sql, [routeId]);

    // Console.log, який виводив 0. Він має почати виводити велике число.
    console.log("==========================================");
    console.log(`[DB RESULT] Отримано рядків Shapes (після ФІНАЛЬНОГО JOIN): ${results.length}`);
    console.log("==========================================");
    
    if (results.length === 0) {
        return [];
    }

    // ... (логіка групування тут) ...
    // ... (якщо вам потрібне групування, ми можемо додати його пізніше)

    return results as RouteShape[];
}