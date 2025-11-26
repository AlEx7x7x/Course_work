// pages/api/vehicles.js

import { GtfsRealtimeBindings } from 'gtfs-realtime-bindings';
import { Buffer } from 'buffer'; // Додатковий імпорт для Node.js Buffer
// Примітка: 'fetch' доступний у Node.js з 18 версії або через поліфіл

const VEHICLE_POSITIONS_URL = 'http://track.ua-gis.com/gtfs/lviv/vehicle_position';

export default async function handler(req, res) {
  try {
    const apiResponse = await fetch(VEHICLE_POSITIONS_URL);

    if (!apiResponse.ok) {
        // Якщо API повертає помилку, ми повинні це зафіксувати
        console.error(`External GTFS API failed: ${apiResponse.statusText}`);
        return res.status(502).json({ error: 'External GTFS Realtime data is currently unavailable' });
    }

    // 1. Отримуємо відповідь як бінарний буфер (ArrayBuffer)
    const arrayBuffer = await apiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); // Конвертуємо ArrayBuffer в Node.js Buffer

    // 2. Розшифровуємо Protocol Buffer
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
    
    // 3. Форматуємо дані
    const vehiclesData = feed.entity.map(entity => {
      // Перевіряємо, чи є GPS-дані
      if (entity.vehicle && entity.vehicle.position) {
        return {
          id: entity.id,
          routeId: entity.vehicle.trip?.routeId,
          lat: entity.vehicle.position.latitude,
          lng: entity.vehicle.position.longitude,
          speed: entity.vehicle.position.speed || 0, 
          // Примітка: Якщо routeId не визначений, це може спричинити помилки фільтрації
          status: 'Online',
          numberPlate: entity.vehicle.vehicle?.label || 'N/A' 
        };
      }
      return null;
    }).filter(v => v !== null);

    // 4. Надсилаємо клієнту чистий JSON
    res.status(200).json(vehiclesData);

  } catch (error) {
    console.error("GTFS Realtime Processing Error:", error);
    res.status(500).json({ error: 'Failed to process GTFS Realtime data' });
  }
}