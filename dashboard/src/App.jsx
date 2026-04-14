import React, { useState } from 'react';
import { Users, AlertTriangle, Activity } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { usePatientsData } from './hooks/usePatientsData';
import { useChat } from './hooks/useChat';
import { usePatientActions } from './hooks/usePatientActions';

// Components
import AuthForm from './components/Auth/AuthForm';
import Sidebar from './components/Dashboard/Sidebar';
import StatCard from './components/Dashboard/StatCard';
import PatientTable from './components/Dashboard/PatientTable';
import AnalyticsView from './components/Dashboard/AnalyticsView';
import AlertsDrawer from './components/Dashboard/AlertsDrawer';
import PatientDetailModal from './components/PatientDetail/PatientDetailModal';
import NewPatientModal from './components/Modals/NewPatientModal';
import DatePickerModal from './components/Modals/DatePickerModal';

const DoctorDashboard = () => {
  // 1. Auth & Data
  const { user, logout } = useAuth();
  const { dashboardData, alerts } = usePatientsData(user);
  const actions = usePatientActions(user);

  // 2. UI State
  const [activePatient, setActivePatient] = useState(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentView, setCurrentView] = useState('monitor');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  // 3. Temporary State for Active Patient Context
  const [weeklyDose, setWeeklyDose] = useState({ L:0, M:0, X:0, J:0, V:0, S:0, D:0 });
  const [chatInput, setChatInput] = useState('');
  
  // 4. Specific Hook for Chat (only active when patient is selected)
  const { messages, sendMessage, chatEndRef } = useChat(activePatient?.id);

  // Handlers
  const handleSelectPatient = (p) => {
      setActivePatient(p);
      setWeeklyDose(p.weeklyDose || { L:0, M:0, X:0, J:0, V:0, S:0, D:0 });
  };

  const handleVerify = async (reading, action) => {
      let reason = '';
      if(action === 'REJECT') {
          reason = prompt("Motivo del rechazo:");
          if(!reason) return;
      }
      
      const success = await actions.verifyReading(activePatient.id, reading, action, reason);
      if(success && action === 'ACCEPT') {
         setActivePatient(prev => ({...prev, latestPending: null, lastVal: reading.value}));
      } else if (success && action === 'REJECT') {
         setActivePatient(prev => ({...prev, latestPending: null}));
      }
  };

  // --- LÓGICA INTELIGENTE: Abrir paciente desde Alerta ---
  const handleAlertClick = (alert) => {
      // Asumimos que la alerta tiene un 'patientId'. Si no, solo cierra el cajón.
      if (alert.patientId) {
          const targetPatient = dashboardData.find(p => p.id === alert.patientId);
          if (targetPatient) {
              handleSelectPatient(targetPatient); // Esto abre el Modal de Detalle
          }
      }
  };

  // Renders
  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      <Sidebar 
          onLogout={logout} 
          alertsCount={alerts.length} 
          onOpenNewPatient={() => setShowNewPatientModal(true)}
          // Props Nuevas para navegación
          currentView={currentView}
          onChangeView={setCurrentView}
          // Al hacer click en "Alertas" en el Sidebar, abrimos el Drawer
          onOpenAlerts={() => setIsAlertsOpen(true)} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Renderizado Condicional de Vistas */}
        {currentView === 'monitor' ? (
            <>
                {/* --- VISTA MONITOR ORIGINAL (StatCards + Table) --- */}
                <div className="bg-white border-b border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    <StatCard title="Total Pacientes" value={dashboardData.length} icon={Users} color="bg-blue-50 text-blue-600" />
                    <StatCard title="Riesgo Crítico" value={dashboardData.filter(p=>p.sev==='red').length} icon={AlertTriangle} color="bg-red-50 text-red-600" />
                    <StatCard title="TTR Global" value={(Math.round(dashboardData.reduce((a,b)=>a+(b.ttr||0),0)/dashboardData.length || 0)) + '%'} icon={Activity} color="bg-emerald-50 text-emerald-600" />
                </div>

                <div className="p-6 grid grid-cols-1 gap-6 h-full overflow-hidden bg-slate-50/50"> 
                    <PatientTable data={dashboardData} onSelectPatient={handleSelectPatient} />
                </div>
            </>
        ) : (
            /* --- VISTA ANALYTICS NUEVA --- */
            <AnalyticsView patients={dashboardData} />
        )}

        {/* Componente DRAWER de Alertas */}
        <AlertsDrawer 
            isOpen={isAlertsOpen}
            onClose={() => setIsAlertsOpen(false)}
            alerts={alerts}
            onDismiss={actions.dismissAlert}
            onClearAll={actions.clearAllAlerts}
            onSelectAlert={handleAlertClick}
        />

        {/* MODALS */}
        {activePatient && (
            <PatientDetailModal 
                patient={activePatient}
                onClose={() => setActivePatient(null)}
                
                // --- CONEXIÓN DE BORRADO ---
                onDelete={async (id) => {
                    const success = await actions.deletePatient(id);
                    if (success) setActivePatient(null); // Cierra el modal si se borró
                }}
                // ---------------------------
                
                // Verificación
                onVerifyReading={handleVerify}
                // Dosis
                doseState={weeklyDose}
                onDoseChange={(day, val) => setWeeklyDose({...weeklyDose, [day]: val})}
                onSaveDose={() => actions.updateDose(activePatient.id, weeklyDose)}
                // Chat
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSendMessage={() => { sendMessage(chatInput); setChatInput(''); }}
                chatRef={chatEndRef}
                // Fecha
                onOpenDateModal={() => setShowDateModal(true)}
            />
        )}

        {showNewPatientModal && (
            <NewPatientModal 
                onClose={() => setShowNewPatientModal(false)} 
                onCreate={async (data) => {
                    const success = await actions.createPatient(data);
                    if(success) setShowNewPatientModal(false);
                }}
            />
        )}

        {showDateModal && activePatient && (
            <DatePickerModal 
                initialDate={activePatient.nextReadingDate ? new Date(activePatient.nextReadingDate.seconds * 1000).toISOString().split('T')[0] : ''}
                onClose={() => setShowDateModal(false)}
                onSave={(date) => {
                    actions.setFollowUpDate(activePatient.id, date);
                    setShowDateModal(false);
                }}
            />
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;