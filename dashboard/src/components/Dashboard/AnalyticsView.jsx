import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Download, FileText, Activity, Users, TrendingUp } from 'lucide-react';

const COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
const PATHOLOGY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const AnalyticsView = ({ patients }) => {
  
  // 1. Lógica de Procesamiento de Datos (Memoized para rendimiento)
  const stats = useMemo(() => {
    const total = patients.length;
    if (total === 0) return null;

    // A. TTR Global
    const avgTTR = patients.reduce((acc, p) => acc + (p.ttr || 0), 0) / total;

    // B. Distribución de Riesgo
    const riskCounts = { green: 0, amber: 0, red: 0 };
    patients.forEach(p => { if (riskCounts[p.sev] !== undefined) riskCounts[p.sev]++; });
    
    const riskData = [
        { name: 'En Meta Terapéutica', value: riskCounts.green, color: COLORS.green },
        { name: 'Riesgo Moderado', value: riskCounts.amber, color: COLORS.amber },
        { name: 'Riesgo Crítico', value: riskCounts.red, color: COLORS.red },
    ].filter(d => d.value > 0);

    // C. Eficacia por Patología (Comparativa)
    const pathologyMap = {};
    patients.forEach(p => {
        const key = p.patologiaCode || 'Otras';
        if (!pathologyMap[key]) pathologyMap[key] = { name: key, totalTTR: 0, count: 0, label: p.motivo || key };
        pathologyMap[key].totalTTR += (p.ttr || 0);
        pathologyMap[key].count += 1;
    });

    const pathologyData = Object.values(pathologyMap).map(item => ({
        name: item.label.split(' ')[0], // Nombre corto para el gráfico
        fullName: item.label,
        avgTTR: Math.round(item.totalTTR / item.count),
        count: item.count
    })).sort((a,b) => b.avgTTR - a.avgTTR); // Mejores resultados primero

    return { total, avgTTR, riskData, pathologyData };
  }, [patients]);

  // 2. Función de Exportación a CSV (Excel/SPSS)
  const handleExport = () => {
    const headers = ['ID_Expediente', 'Nombre', 'Edad', 'Patologia', 'Medicamento', 'Dosis_Semanal_mg', 'Meta_Min', 'Meta_Max', 'Ultimo_INR', 'Fecha_Ultimo_INR', 'TTR_Porcentaje', 'Nivel_Riesgo'];
    
    const rows = patients.map(p => [
        p.expediente,
        `"${p.nombre}"`, // Comillas para nombres con espacios
        p.edad,
        p.patologiaCode,
        p.medicamento,
        Object.values(p.weeklyDose || {}).reduce((a,b)=>a+b,0), // Suma dosis semanal
        p.minTargetINR,
        p.maxTargetINR,
        p.lastVal,
        p.lastDate,
        p.ttr,
        p.sev === 'green' ? 'CONTROLADO' : p.sev === 'amber' ? 'ALERTA' : 'CRITICO'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estudio_clot_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!stats) return <div className="p-10 text-center text-slate-400">Sin datos suficientes para análisis.</div>;

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-600"/> Analytics & Cohorte
        </h2>
        <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95">
            <Download size={18}/> Exportar Base de Datos (.CSV)
        </button>
      </div>

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><TrendingUp size={14}/> Calidad Global (TTR)</div>
            <div className="text-4xl font-black text-indigo-600">{stats.avgTTR.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 mt-2">Promedio de toda la cohorte</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Users size={14}/> Población Total</div>
            <div className="text-4xl font-black text-slate-800">{stats.total}</div>
            <div className="text-xs text-slate-500 mt-2">Pacientes activos en protocolo</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><FileText size={14}/> Registros de Datos</div>
            <div className="text-4xl font-black text-emerald-600">{patients.reduce((acc, p) => acc + (p.history?.length || 0), 0)}</div>
            <div className="text-xs text-slate-500 mt-2">Lecturas de INR totales analizadas</div>
        </div>
      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Eficacia por Patología */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-96 flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4">Eficacia Clínica por Patología (TTR Promedio)</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.pathologyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fontWeight: 'bold'}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="avgTTR" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30}>
                            {stats.pathologyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PATHOLOGY_COLORS[index % PATHOLOGY_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Gráfico 2: Estratificación de Riesgo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-96 flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4">Estratificación de Riesgo Actual</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.riskData}
                            cx="50%" cy="50%"
                            innerRadius={80} outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.riskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;