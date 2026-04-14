import React from 'react';
import { LayoutDashboard, Users, Bell, LogOut, BarChart2 } from 'lucide-react';

const NavItem = ({ icon: Icon, children, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
    <Icon size={20} strokeWidth={2} /> 
    {children}
  </div>
);

// Agrega la prop 'onOpenAlerts'
const Sidebar = ({ onLogout, alertsCount = 0, onOpenNewPatient, currentView, onChangeView, onOpenAlerts }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-20">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-indigo-700 font-black text-2xl tracking-tighter">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-teal-400 rounded-lg shadow-sm"></div> CLOT
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <NavItem 
          icon={LayoutDashboard} 
          active={currentView === 'monitor'} 
          onClick={() => onChangeView('monitor')}
        >
          Monitor
        </NavItem>

        <NavItem 
          icon={BarChart2} 
          active={currentView === 'analytics'} 
          onClick={() => onChangeView('analytics')}
        >
          Estadísticas
        </NavItem>

        <NavItem icon={Users} onClick={onOpenNewPatient}>Alta de Paciente</NavItem>
        
        <NavItem icon={Bell} onClick={onOpenAlerts}> {/* <--- Agregar onClick */}
          Alertas 
          {alertsCount > 0 && (
            <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {alertsCount}
            </span>
          )}
        </NavItem>
      </nav>
      
      <div className="p-4 border-t text-center">
        <button onClick={onLogout} className="text-red-500 text-sm font-bold flex items-center justify-center gap-2">
          <LogOut size={16}/> Salir
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;