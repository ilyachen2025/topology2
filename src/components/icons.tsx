import React from 'react';

export const TransformerIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="black" strokeWidth="3"/>
    <circle cx="50" cy="90" r="35" stroke="black" strokeWidth="3"/>
  </svg>
);

export const GroupChargerIcon = () => (
  <div className="w-full h-full bg-white border-2 border-gray-300 rounded-sm shadow-sm flex flex-col">
    <div className="h-8 bg-gray-200 m-1 rounded-sm"></div>
    <div className="flex-1 flex items-center justify-center text-blue-600 font-bold italic text-lg tracking-widest">ONE</div>
    <div className="h-4 bg-gray-400 w-full mt-auto"></div>
  </div>
);

export const BatteryCabinetIcon = () => (
  <div className="w-full h-full bg-white border-2 border-gray-200 rounded-sm shadow-sm flex flex-col items-center justify-end pb-2 relative">
    <div className="w-4 h-4 bg-yellow-400 rotate-45 mb-4 border border-yellow-500"></div>
    <div className="w-full h-2 bg-gray-300 absolute bottom-0"></div>
  </div>
);

export const EquipmentCabinetIcon = () => (
  <div className="w-full h-full bg-white border-2 border-gray-200 rounded-sm shadow-sm flex flex-col items-center justify-between py-2 relative">
    <div className="w-10 h-12 bg-gray-200 mt-1"></div>
    <div className="w-4 h-4 bg-yellow-400 rotate-45 mb-4 border border-yellow-500"></div>
    <div className="w-full h-2 bg-gray-300 absolute bottom-0"></div>
  </div>
);

export const DCDCCabinetIcon = () => (
  <div className="w-full h-full bg-white border-2 border-gray-200 rounded-sm shadow-sm flex flex-col items-center justify-between py-2 relative">
    <div className="w-10 h-10 bg-gray-200 mt-2"></div>
    <div className="w-4 h-4 bg-yellow-400 rotate-45 mb-4 border border-yellow-500"></div>
    <div className="w-full h-2 bg-gray-300 absolute bottom-0"></div>
  </div>
);

export const SplitChargerIcon = () => (
  <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-t-xl shadow-sm flex flex-col items-center pt-2 relative">
    <div className="w-6 h-12 bg-gray-800 rounded-sm flex items-center justify-center">
      <div className="text-green-400 font-bold text-lg">⚡</div>
    </div>
    <div className="w-full h-2 bg-gray-300 absolute bottom-0"></div>
    {/* Cables */}
    <div className="absolute -left-2 top-10 w-2 h-10 border-l-2 border-b-2 border-gray-800 rounded-bl-lg"></div>
    <div className="absolute -right-2 top-10 w-2 h-10 border-r-2 border-b-2 border-gray-800 rounded-br-lg"></div>
  </div>
);

export const FastChargerIcon = () => (
  <div className="w-full h-full bg-gray-200 border border-gray-300 rounded-t-xl shadow-sm flex flex-col items-center pt-2 relative">
    <div className="w-6 h-10 bg-gray-700 rounded-sm flex items-center justify-center">
      <div className="text-green-400 font-bold text-sm">⚡</div>
    </div>
    <div className="w-full h-2 bg-gray-400 absolute bottom-0"></div>
    {/* Cable */}
    <div className="absolute -left-2 top-10 w-2 h-10 border-l-2 border-b-2 border-gray-800 rounded-bl-lg"></div>
  </div>
);
