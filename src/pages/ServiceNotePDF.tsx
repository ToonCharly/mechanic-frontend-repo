import React from 'react';
import { Service } from '../types/service';

interface Props {
  service: Service;
}

export const ServiceNotePDF = React.forwardRef<HTMLDivElement, Props>(({ service }, ref) => {
  const getVehicleInfo = () => {
    const vehicle = service.vehicle;
    if (!vehicle) return "N/A";
    
    let info = `${vehicle.brand} ${vehicle.model || ''}`.trim();
    if (!info) info = vehicle.client_name || "Vehículo";
    
    if (vehicle.year) {
      info += ` (${vehicle.year})`;
    }
    
    if (vehicle.plate_number && vehicle.plate_number !== 'N/A') {
      info += ` - ${vehicle.plate_number}`;
    }
    
    return info;
  };

  const getTotalCost = () => {
    if (!service.items) return 0;
    return service.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0);
  };

  return (
    <div ref={ref} className="w-[800px] min-h-[1056px] bg-[#f4f6f8] font-sans relative overflow-hidden flex flex-col text-gray-800">
      
      {/* Decorative Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-80 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }}></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-white" style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 100%)' }}></div>

      <div className="relative z-10 flex-1 flex flex-col p-12">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-col items-start">
            <div className="w-40 flex-shrink-0 flex items-center justify-start mb-3">
              <img 
                src="/logo-champion.png" 
                alt="Taller Mecánico Champion Logo" 
                className="w-full h-auto"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-[#1a4b5c] text-xs font-medium space-y-0.5">
              <p className="font-bold text-sm">Servicio Mecánico Automotriz</p>
              <p>Tec. Carlos Pech</p>
              <p>Cel. 9993965022</p>
              <p>Calle 139 No. 377 x 50 y 48, 5 Colonias Mérida, Yuc</p>
            </div>
          </div>
          <div className="text-right pt-4">
            <h1 className="text-5xl font-black text-[#1a4b5c] tracking-[0.1em] uppercase">NOTA DE SERVICIO</h1>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex-1 pr-8">
            <h2 className="text-[#1a4b5c] font-black text-lg uppercase tracking-wider mb-4">
              Información del Cliente
            </h2>
            <div className="grid grid-cols-[90px_1fr] gap-y-1 text-sm">
              <span className="font-bold text-[#1a4b5c]">Nombre:</span>
              <span className="text-gray-600">{service.vehicle?.client_name || 'N/A'}</span>
              <span className="font-bold text-[#1a4b5c]">Número:</span>
              <span className="text-gray-600">{service.vehicle?.phone || 'N/A'}</span>
              <span className="font-bold text-[#1a4b5c]">Vehículo:</span>
              <span className="text-gray-600">{getVehicleInfo()}</span>
            </div>
          </div>
          <div className="text-right text-sm pt-10">
            <div>
              <span className="font-bold text-[#1a4b5c] mr-3 uppercase">Fecha de Servicio:</span>
              <span className="text-gray-600">{new Date(service.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1a4b5c] text-white">
                <th className="py-3 px-4 text-left font-bold uppercase tracking-wider rounded-tl-lg">Artículo</th>
                <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Cant.</th>
                <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Precio</th>
                <th className="py-3 px-4 text-right font-bold uppercase tracking-wider rounded-tr-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {service.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 even:bg-[#e8ebf0] bg-transparent">
                  <td className="py-4 px-4 text-gray-700">{item.description}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-4 px-4 text-center text-gray-700">${item.price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-gray-700">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="w-full h-1 bg-[#1a4b5c]"></div>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end mb-10">
          <div className="w-64 text-sm text-right">
            <div className="flex justify-between items-center py-2 px-4 bg-[#1a4b5c] text-white rounded-lg font-bold text-lg">
              <span>TOTAL</span>
              <span>${getTotalCost().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM SPACING */}
        <div className="mt-auto pt-8"></div>

        {/* FOOTER */}
        <div className="mt-12 pt-6 border-t-2 border-[#1a4b5c] flex justify-between items-center text-xs text-gray-600">
          <span className="font-bold text-[#1a4b5c] text-sm">Taller Mecánico Champion</span>
          <span className="px-4 border-l border-gray-400">Calidad y Servicio Garantizado</span>
        </div>
      </div>
    </div>
  );
});