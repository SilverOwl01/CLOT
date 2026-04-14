import React from 'react';

const TabletIcon = ({ type }) => {
  // Colores realistas: Blanco hueso para la pastilla, ranuras en gris suave
  const tabletColor = "bg-[#fdfcf8]"; // Color crema/pastilla
  const emptySpaceColor = "bg-slate-200/30"; // Espacio vacío sutil
  
  // Estilo base circular
  const baseClass = "relative w-10 h-10 rounded-full border-2 border-slate-300 shadow-sm overflow-hidden transition-all duration-500";
  
  // Ranuras en cruz (Score lines) 
  const scoreLines = (
    <>
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-300/40 -translate-x-1/2 z-10" />
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-300/40 -translate-y-1/2 z-10" />
    </>
  );

  if (type === 'FULL') return (
    <div className={`${baseClass} ${tabletColor}`}>
      {scoreLines}
      <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" />
    </div>
  );

  if (type === 'HALF') return (
    <div className={`${baseClass} ${emptySpaceColor} border-dashed`}>
      {/* Mitad izquierda física */}
      <div className={`absolute top-0 left-0 w-1/2 h-full ${tabletColor} border-r border-slate-300 z-20 shadow-sm`} />
      {scoreLines}
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 z-0">½</span>
    </div>
  );

  return ( // QUARTER
    <div className={`${baseClass} ${emptySpaceColor} border-dashed`}>
      {/* Cuarto superior izquierdo físico */}
      <div className={`absolute top-0 left-0 w-1/2 h-1/2 ${tabletColor} border-r border-b border-slate-300 rounded-tl-full z-20 shadow-sm`} />
      {scoreLines}
      <span className="absolute right-1 bottom-1 text-[10px] font-black text-slate-400 z-0">¼</span>
    </div>
  );
};

export const TabletDisplay = ({ dosis, tabletSize }) => {
  const numTabletasCompletas = Math.floor(dosis / tabletSize);
  const resto = dosis % tabletSize;
  const porcentajeResto = resto / tabletSize;

  const tabletas = [];
  for (let i = 0; i < numTabletasCompletas; i++) tabletas.push('FULL');
  
  if (porcentajeResto > 0 && porcentajeResto <= 0.35) tabletas.push('QUARTER');
  else if (porcentajeResto > 0.35 && porcentajeResto <= 0.7) tabletas.push('HALF');
  else if (porcentajeResto > 0.7) tabletas.push('FULL');

  return (
    <div className="flex gap-2 items-center flex-wrap justify-end">
      {tabletas.map((t, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <TabletIcon type={t} />
        </div>
      ))}
    </div>
  );
};