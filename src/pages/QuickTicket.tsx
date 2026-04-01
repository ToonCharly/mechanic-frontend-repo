import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSnackbar } from "../components/Snackbar";

export default function QuickTicket() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [cliente, setCliente] = useState({ nombre: "", telefono: "" });
  const [carro, setCarro] = useState({ descripcion: "", color: "" });
  const [servicios, setServicios] = useState<{descripcion: string, cantidad: number | string, costo: number | string}[]>([{ descripcion: "", cantidad: 1, costo: 0 }]);
  const [loading, setLoading] = useState(false);

  const handleAddService = () => {
    setServicios([...servicios, { descripcion: "", cantidad: 1, costo: 0 }]);
  };

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    const newServicios = [...servicios];
    newServicios[index] = { ...newServicios[index], [field]: value };
    setServicios(newServicios);
  };

  const handleRemoveService = (index: number) => {
    if (servicios.length === 1) return;
    const newServicios = servicios.filter((_, i) => i !== index);
    setServicios(newServicios);
  };

  const total = servicios.reduce((acc, curr) => acc + ((Number(curr.costo) || 0) * (Number(curr.cantidad) || 1)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!cliente.nombre.trim()) {
      showSnackbar({ message: "El nombre del cliente es requerido", type: "error" });
      setLoading(false);
      return;
    }
    if (!carro.descripcion.trim()) {
      showSnackbar({ message: "La descripción del vehículo es requerida", type: "error" });
      setLoading(false);
      return;
    }
    
    const validServices = servicios
      .filter((s) => s.descripcion.trim() !== "")
      .map((s) => ({
        ...s,
        cantidad: s.cantidad === "" || isNaN(Number(s.cantidad)) ? 1 : Number(s.cantidad),
        costo: s.costo === "" || isNaN(Number(s.costo)) ? 0 : Number(s.costo),
      }));

    if (validServices.length === 0) {
      showSnackbar({ message: "Agrega al menos un servicio válido", type: "error" });
      setLoading(false);
      return;
    }

    try {
      await api.post("/services/quick", {
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        vehiculoDesc: carro.descripcion,
        vehiculoColor: carro.color,
        servicios: validServices,
      });

      showSnackbar({ message: "Notita guardada con éxito", type: "success" });
      
      setCliente({ nombre: "", telefono: "" });
      setCarro({ descripcion: "", color: "" });
      setServicios([{ descripcion: "", cantidad: 1, costo: 0 }]);
      
      navigate("/dashboard");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error || "Error al guardar";
      showSnackbar({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Nota de Servicio</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
              <input 
                type="text" 
                value={cliente.nombre}
                onChange={e => setCliente({...cliente, nombre: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                type="text" 
                value={cliente.telefono}
                onChange={e => setCliente({...cliente, telefono: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Vehículo *</label>
              <input 
                type="text" 
                placeholder="Ej. Toyota Corolla 2018"
                value={carro.descripcion}
                onChange={e => setCarro({...carro, descripcion: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. Rojo"
                value={carro.color}
                onChange={e => setCarro({...carro, color: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Servicios Realizados *
              </label>
              <button
                type="button"
                onClick={handleAddService}
                className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center self-start sm:self-auto"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {servicios.map((srv, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="w-full">
                    <input
                      type="text"
                      placeholder="Descripción del servicio"
                      value={srv.descripcion}
                      onChange={(e) => handleServiceChange(index, "descripcion", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                      required
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Cantidad"
                        value={srv.cantidad}
                        onChange={(e) => handleServiceChange(index, "cantidad", e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        required
                      />
                    </div>
                    <div className="flex-1 relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Precio"
                        value={srv.costo}
                        onChange={(e) => handleServiceChange(index, "costo", e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        required
                      />
                    </div>
                    {servicios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Eliminar"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
             <div className="bg-gray-50 rounded-lg px-6 py-4 border border-gray-200 shadow-sm flex items-center gap-4">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 flex items-center"
            >
               {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar Notita"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
