import { db } from '../config/database.js';
import { gamification, menus } from '../../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

export class GamificationService {
    /**
     * Calcula el ahorro estimado acumulado del usuario frente a "comer improvisado".
     * Usaremos un valor base mock para la Fase 1: 35€ ahorrados por cada semana de racha.
     */
    static async getSavings(userId: number): Promise<number> {
        const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
        const streak = stats?.streak || 0;
        // Mock value: 35€ saved per week on streak
        return streak > 0 ? streak * 35 : 0;
    }

    /**
     * Retorna el nivel culinario basado en los puntos (reflejo de variedad, complejidad, consistencia).
     * Para Fase 1, basamos el nombre del perfil elegante en los puntos de gamificación.
     */
    static async getCulinaryLevel(userId: number): Promise<string> {
        const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
        const points = stats?.points || 0;

        if (points >= 7000) return 'Chef Ejecutivo';
        if (points >= 3500) return 'Maestro del Menú';
        if (points >= 1500) return 'Planificador Constante';
        if (points >= 500) return 'Explorador Culinario';
        return 'Iniciado';
    }

    /**
     * Genera el resumen para la revisión del domingo.
     * Usando datos calculados/simulados para la Fase 1.
     */
    static async getSundayReview(userId: number) {
        // Para Fase 1 utilizamos datos optimistas y creíbles para conducir el frontend
        return {
            savingsEstimated: 45, // € ahorrados la semana pasada vs comer fuera
            wastePercentage: 12, // 12% de comida desperdiciada (mejora sobre media)
            varietyScore: 8, // Nivel de variedad sobre 10
            averagePrepTime: 25, // Tiempo medio por receta en minutos
        };
    }
}
