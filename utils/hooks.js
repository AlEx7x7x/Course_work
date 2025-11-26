// utils/hooks.js (ФІНАЛЬНА ВЕРСІЯ З ІМЕНОВАНИМ ЕКСПОРТОМ)
import { useEffect, useState, useMemo, useCallback } from 'react';
import { mockSchedules, mockRoutes } from '../public/mockData'; 
import { getMockVehicles } from './mockVehicleSimulator'; 
// Примітка: mockVehicleSimulator.js повинен існувати!

// =========================================================
// 1. Хук для ОТРИМАННЯ ДАНИХ ТРАНСПОРТНИХ ЗАСОБІВ (MOCK)
// =========================================================
export const useVehicles = () => { // 🚨 ЗМІНА: export const
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMockData = useCallback(async () => {
    try {
      const mockData = getMockVehicles(); 
      setVehicles(mockData);
      setIsLoading(false);
    } catch (error) {
      console.error("Помилка імітації транспорту:", error);
      setIsLoading(false);
      setVehicles([]);
    }
  }, []);

  useEffect(() => {
    fetchMockData(); 
    const intervalId = setInterval(fetchMockData, 200); 
    return () => clearInterval(intervalId);
  }, [fetchMockData]);

  return { vehicles, isLoading };
};


// =========================================================
// 2. Хук для ОТРИМАННЯ МАРШРУТІВ (STATIC)
// =========================================================
export const useRoutes = () => { // 🚨 ЗМІНА: export const
  const routes = useMemo(() => mockRoutes, []);
  return routes;
};


// =========================================================
// 3. Хук для ОТРИМАННЯ ГРАФІКІВ (MOCK)
// =========================================================
export const useSchedules = (routeId) => { // 🚨 ЗМІНА: export const
  const schedules = useMemo(() => {
    if (!routeId) return mockSchedules;
    return mockSchedules.filter(s => s.routeId === routeId);
  }, [routeId]);

  return schedules;
};


// =========================================================
// 4. ЕКСПОРТ (ЗАСТАРІЛИЙ DEFAULT EXPORT ДЛЯ СУМІСНОСТІ)
// =========================================================
// Цей експорт залишаємо, щоб уникнути помилок в інших файлах, які використовують default імпорт.
// Але ми будемо використовувати іменовані імпорти.
const hooks = { useVehicles, useRoutes, useSchedules }; 
export default hooks;