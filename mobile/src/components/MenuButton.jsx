// src/components/MenuButton.jsx
import React from 'react';

const MenuButton = ({ icon: Icon, label, onClick }) => ( 
  <button onClick={onClick} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition hover:shadow-md">
    <Icon size={32} className="text-slate-300"/> 
    <span className="font-bold text-slate-600 text-sm">{label}</span>
  </button> 
);

export default MenuButton;