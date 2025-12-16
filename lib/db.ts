// lib/db.ts
import mysql from 'mysql2/promise';

// Конфігурація підключення: пріоритет змінним середовища
const config = {
    // Рекомендується використовувати .env.local
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '02102006', 
    database: process.env.DB_NAME || 'swiftroute',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306, // Парсимо порт
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true, // Повертає дати як рядки
};

if (!config.database || !config.password) {
    console.error("КРИТИЧНА ПОМИЛКА КОНФІГУРАЦІЇ БД: Перевірте DB_NAME та DB_PASSWORD.");
    // У Next.js можна припинити роботу на цьому етапі, якщо конфігурація критична
}

// Створення пулу підключень
const pool = mysql.createPool(config);

/**
 * Виконує параметризований SQL запит
 * @param {string} sql - SQL-запит із плейсхолдерами (?).
 * @param {Array<any>} [params=[]] - Масив параметрів для запиту.
 */
export async function query(sql: string, params: Array<any> = []): Promise<any[]> {
    if (!config.database) {
        throw new Error("Конфігурація БД неповна (DB_NAME відсутній).");
    }
    
    let connection: mysql.PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        
        // Використовуємо execute для параметризованих запитів (захист від SQL-ін'єкцій)
        const [rows] = await connection.execute(sql, params);
        
        // Знімаємо коментарі, якщо потрібне детальне логування
        // console.log(`[DB SUCCESS] SQL: ${sql.substring(0, 80)}...`);
        // console.log(`[DB RESULT] Отримано рядків: ${Array.isArray(rows) ? rows.length : 'N/A'}`);
        
        return Array.isArray(rows) ? rows : [];
    } catch (error) {
        console.error("==========================================");
        console.error("❌ DB QUERY FAILED");
        console.error(`SQL, що викликав помилку: ${sql}`);
        console.error("Деталі помилки:", (error as Error).message);
        console.error("==========================================");
        
        throw new Error(`Помилка запиту до БД: ${(error as Error).message}.`);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}