// app/api/shapes/[routeId]/route.ts

import { NextResponse } from 'next/server';
import { getRouteShapes } from '@/lib/gtfs-service'; // Імпорт бізнес-логіки (Псевдонім)
// Інтерфейс для параметрів, що передаються в URL
interface Context {
    params: { routeId: string };
}

/**
 * GET handler: Отримує географічні точки для всіх поїздок певного маршруту.
 * URL: /api/shapes/[routeId]
 */
export async function GET(request: Request, context: Context) {
  const routeId = context.params.routeId;
  
  if (!routeId) {
    return NextResponse.json({ message: 'Не вказано ідентифікатор маршруту (routeId).' }, { status: 400 });
  }

  try {
    // Викликаємо функцію з сервісного шару
    const shapesData = await getRouteShapes(routeId);
    
    if (shapesData.length === 0) {
        return NextResponse.json({ message: `Маршрут з ID "${routeId}" не знайдено, або він не має точок.` }, { status: 404 });
    }

    // Встановлення заголовків кешування на 24 години (86400 секунд)
    return NextResponse.json(shapesData, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error(`Помилка отримання точок для маршруту ${routeId}:`, error);
    return NextResponse.json(
      { message: 'Внутрішня помилка сервера при запиті до бази даних.' },
      { status: 500 }
    );
  }
}