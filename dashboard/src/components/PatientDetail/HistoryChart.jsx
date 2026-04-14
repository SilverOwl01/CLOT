import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

const HistoryChart = ({ history, minTarget, maxTarget }) => {
  return (
    <div className="h-96 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
      <h4 className="font-bold text-lg mb-4">Gráfico Histórico</h4>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
          {/* Zona Terapéutica */}
          <ReferenceArea y1={minTarget} y2={maxTarget} fill="#dcfce7" fillOpacity={0.6}/>
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} 
          />
          <YAxis domain={[1, 6]} label={{ value: 'INR', angle: -90, position: 'insideLeft' }}/>
          <Tooltip 
            labelFormatter={(label) => new Date(label).toLocaleDateString()} 
            formatter={(value) => [value.toFixed(2), 'INR']}
          />
          <Line type="monotone" dataKey="value" stroke="#2a788e" strokeWidth={3} dot={{r:3}} activeDot={{r:6}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;