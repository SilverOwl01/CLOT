// src/utils/clinicalMath.js

// Rangos terapéuticos y códigos de patología [cite: 7-9]
export const CLINICAL_RANGES = {
    'fa': { label: 'Fibrilación Auricular / Aleteo', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'iam': { label: 'IAM Anterior + Trombo / Alto Riesgo', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'valv_aorta': { label: 'Válvula Aórtica Mecánica', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'valv_mitral': { label: 'Válvula Mitral Mecánica', min: 2.5, max: 3.5, crit_low: 2.2, crit_high: 3.8 },
    'valv_bio': { label: 'Válvula Bioprotésica Mitral (<3 meses)', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'valv_old': { label: 'Válvula Aórtica Antigua (Bola/Jaula)', min: 2.5, max: 3.5, crit_low: 2.2, crit_high: 3.8 },
    'tvp': { label: 'Tromboembolismo Venoso (TEV)', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'saf': { label: 'Síndrome Antifosfolípido', min: 2.0, max: 3.0, crit_low: 1.7, crit_high: 3.3 },
    'hemo_cons': { label: 'Hemodiálisis - Esquema Conservador', min: 1.5, max: 2.0, crit_low: 1.2, crit_high: 2.3 },
    'hemo_int': { label: 'Hemodiálisis - Esquema Intensivo', min: 2.0, max: 2.5, crit_low: 1.7, crit_high: 2.8 },
    'custom': { label: 'Personalizado / Otro', min: 2.0, max: 3.0, crit_low: 1.5, crit_high: 4.0 }
};

// Algoritmo de interpolación lineal para TTR (Rosendaal) [cite: 10]
export const calculateRosendaal = (readings, minTarget, maxTarget) => {
    if (readings.length < 2) return 0;
    
    let timeInRange = 0, totalTime = 0;
    const sorted = [...readings].sort((a,b) => a.date - b.date);

    for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i], end = sorted[i+1];
        const duration = (end.date - start.date) / (1000 * 60 * 60 * 24);
        
        if (duration <= 0) continue;
        
        totalTime += duration;
        const vs = start.value, ve = end.value;

        if (vs >= minTarget && vs <= maxTarget && ve >= minTarget && ve <= maxTarget) {
            timeInRange += duration;
        } else if ((vs < minTarget && ve < minTarget) || (vs > maxTarget && ve > maxTarget)) {
            timeInRange += 0;
        } else {
            const slope = (ve - vs) / duration;
            let timeIn = 0;
            const tMin = (minTarget - vs) / slope;
            const tMax = (maxTarget - vs) / slope;
            
            const points = [0, duration];
            if (tMin > 0 && tMin < duration) points.push(tMin);
            if (tMax > 0 && tMax < duration) points.push(tMax);
            points.sort((a,b) => a - b);

            for(let j=0; j<points.length-1; j++) {
                const p1 = points[j], p2 = points[j+1];
                const midVal = vs + slope * (p1 + p2) / 2;
                if(midVal >= minTarget && midVal <= maxTarget) timeIn += (p2 - p1);
            }
            timeInRange += timeIn;
        }
    }
    return totalTime === 0 ? 0 : Math.round((timeInRange / totalTime) * 100);
};