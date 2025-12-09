
import { GtfsRealtimeBindings } from 'gtfs-realtime-bindings';
import { Buffer } from 'buffer';

const VEHICLE_POSITIONS_URL = 'http://track.ua-gis.com/gtfs/lviv/vehicle_position';

export default async function handler(req, res) {
  try {
    const apiResponse = await fetch(VEHICLE_POSITIONS_URL);

    if (!apiResponse.ok) {
        console.error(`External GTFS API failed: ${apiResponse.statusText}`);
        return res.status(502).json({ error: 'External GTFS Realtime data is currently unavailable' });
    }

    const arrayBuffer = await apiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); 

    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
    
    const vehiclesData = feed.entity.map(entity => {
      if (entity.vehicle && entity.vehicle.position) {
        return {
          id: entity.id,
          routeId: entity.vehicle.trip?.routeId,
          lat: entity.vehicle.position.latitude,
          lng: entity.vehicle.position.longitude,
          speed: entity.vehicle.position.speed || 0, 
          status: 'Online',
          numberPlate: entity.vehicle.vehicle?.label || 'N/A' 
        };
      }
      return null;
    }).filter(v => v !== null);

    res.status(200).json(vehiclesData);

  } catch (error) {
    console.error("GTFS Realtime Processing Error:", error);
    res.status(500).json({ error: 'Failed to process GTFS Realtime data' });
  }
}