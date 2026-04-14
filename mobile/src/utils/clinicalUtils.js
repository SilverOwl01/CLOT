// src/utils/clinicalUtils.js

// --- SEMÁFORO DE COLORES ---
export const getStatusGradient = (value, min = 2.0, max = 3.0) => {
  if (!value) return "from-gray-400 to-gray-500";
  const numVal = parseFloat(value);
  if (numVal >= min && numVal <= max) return "from-[#2a788e] to-[#1f5c6d]";
  if ((numVal >= min - 0.5 && numVal < min) || (numVal > max && numVal <= max + 0.5)) return "from-amber-400 to-orange-400";
  return "from-red-500 to-rose-600";
};

// --- LÓGICA DIFUSA PARA ICONOS DE PASTILLAS ---
export const getIconType = (dosisRegistrada, tabletSize = 5) => {
  const porcentaje = dosisRegistrada / tabletSize; 
  if (porcentaje > 0.25 && porcentaje <= 0.70) return 'HALF';
  if (porcentaje > 0.70) return 'FULL';
  return 'QUARTER';
};