import React, { useState, useEffect } from 'react';
import './Disclaimer.css'; 

const MedicalDisclaimer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('clot_legal_accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (hasChecked) {
      localStorage.setItem('clot_legal_accepted', 'true');
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="clot-overlay">
      <div className="clot-modal">
        <div className="clot-modal-header">
          <span className="icon-shield">⚖️</span>
          <h2>Aviso Legal y de Seguridad</h2>
        </div>
        
        <div className="clot-modal-body">
          <section className="disclaimer-section">
            <h3>1. Naturaleza de la herramienta</h3>
            <p><strong>CLOT</strong> es una herramienta de comunicación y seguimiento clínico, no un servicio médico.</p>
            <p>No diagnostica, no prescribe, no sugiere dosis y no sustituye la valoración médica presencial o por telemedicina formal. La persona usuaria reconoce que toda decisión clínica corresponde exclusivamente al médico tratante, quien captura la dosis y realiza el ajuste de manera manual.</p>
          </section>

          <section className="emergency-box">
            <h3>⚠️ No emergencias</h3>
            <p>CLOT no está diseñado para urgencias. Si presentas síntomas de alarma o una emergencia, <strong>llama al 911</strong> o acude al servicio de urgencias.</p>
            <p className="small-text">Los tiempos de respuesta por mensajería pueden variar y no garantizan atención inmediata.</p>
          </section>

          <section className="disclaimer-section">
            <h3>2. Datos capturados por el paciente</h3>
            <p>El paciente puede capturar INR y cargar fotografías de resultados; el paciente declara que la información cargada es veraz, completa y vigente. El médico decide con base en su juicio clínico y en la información que considere confiable.</p>
          </section>

          <section className="disclaimer-section">
            <h3>3. Relación con el expediente clínico</h3>
            <p>CLOT no es (por sí mismo) expediente clínico. Almacena mensajes y fotografías como apoyo, pero no sustituye la obligación del médico/establecimiento de integrar la información al expediente clínico institucional conforme a la normativa en México.</p>
          </section>

          <section className="disclaimer-section">
            <h3>4. Confidencialidad</h3>
            <p>Implementamos controles para proteger sus datos; sin embargo, ningún sistema es infalible. Se establecen medidas contra daño, pérdida, alteración o uso no autorizado.</p>
          </section>

          <p className="legal-footer">
            Al continuar, aceptas los Términos, el Aviso de Privacidad y el uso de tus datos conforme a la legislación mexicana aplicable.
          </p>
        </div>

        <div className="clot-modal-footer">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={hasChecked} 
              onChange={() => setHasChecked(!hasChecked)} 
            />
            <span className="checkmark"></span>
            He leído y acepto los términos.
          </label>
          
          <button 
            className={`accept-button ${!hasChecked ? 'disabled' : ''}`}
            onClick={handleAccept}
            disabled={!hasChecked}
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalDisclaimer;