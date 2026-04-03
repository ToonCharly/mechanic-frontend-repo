import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import { Layout } from "../components/Layout";
import { api } from "../services/api";
import { Service, ServiceStatus, ServiceItem, CreateServiceRequest, UpdateServiceRequest } from "../types/service";
import { Vehicle } from "../types/vehicle";
import { useConfirm } from "../components/ConfirmDialog";
import { useSnackbar } from "../components/Snackbar";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { ServiceNotePDF } from "../components/ServiceNotePDF";
import html2canvas from "html2canvas";

type ServiceFormData = {
  vehicle_id: string;
  description: string;
  items: ServiceItem[];
  status?: ServiceStatus;
};

export const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | "all">("all");
  const confirm = useConfirm();
  const { showSnackbar } = useSnackbar();
  const [error, setError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  const componentToPrintRef = useRef<HTMLDivElement>(null);
  
  const handleShare = async () => {
    const element = componentToPrintRef.current;
    if (!element) return;

    try {
      showSnackbar({ message: "Generando imagen...", type: "success" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(element, { scale: 2, useCORS: true } as any);
      
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          showSnackbar({ message: "Error al generar la imagen", type: "error" });
          return;
        }
        
        const file = new File([blob], `Nota_Servicio.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Nota de Servicio - F&F Workshop',
              text: 'Adjunto su nota de servicio.',
              files: [file]
            });
            showSnackbar({ message: "Nota compartida exitosamente", type: "success" });
          } catch (error) {
            console.error("Error compartiendo:", error);
            // If the user cancelled sharing, don't show an error
          }
        } else {
          // Fallback if sharing files is not supported (e.g., most desktop browsers)
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "Nota_Servicio.png";
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showSnackbar({ message: "Imagen descargada. Puedes compartirla manualmente.", type: "success" });
        }
      }, 'image/png');
    } catch (error) {
      console.error("Error al generar la vista:", error);
      showSnackbar({ message: "No se pudo crear la imagen de la nota", type: "error" });
    }
  };

  const [formData, setFormData] = useState<ServiceFormData>({
    vehicle_id: "",
    description: "",
    items: [{ description: "", quantity: 1, price: 0 }],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const servicesRes = await api.get<{ data: Service[], pagination: { page: number, limit: number, total: number, total_pages: number } }>(
        `/services?page=${currentPage}&limit=${itemsPerPage}`
      );
      setServices(servicesRes.data.data);
      
      // Set pagination metadata
      if (servicesRes.data.pagination) {
        setTotalPages(servicesRes.data.pagination.total_pages);
        setTotalItems(servicesRes.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate at least one item with valid data
    const validItems = formData.items
      .filter(item => item.description.trim() && item.price >= 0)
      .map(item => ({
        ...item,
        quantity: item.quantity === 0 || !item.quantity ? 1 : Number(item.quantity)
      }));
      
    if (validItems.length === 0) {
      setError("Debes agregar al menos un servicio con descripción y precio válido");
      return;
    }

    try {
      if (editingService) {
        // When updating
        const updateData: UpdateServiceRequest = {
          description: formData.description,
          items: validItems,
          status: formData.status!,
        };
        await api.put(`/services/${editingService.id}`, updateData);
        showSnackbar({ message: "Servicio actualizado exitosamente", type: "success" });
      } else {
        // When creating
        const createData: CreateServiceRequest = {
          vehicle_id: formData.vehicle_id,
          description: formData.description,
          items: validItems,
        };
        await api.post("/services", createData);
        setCurrentPage(1); // Reset to first page after creating
        showSnackbar({ message: "Servicio creado exitosamente", type: "success" });
      }

      fetchData();
      closeModal();
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMsg = error.response?.data?.error || "Error al guardar el servicio";
      setError(errorMsg);
      showSnackbar({ message: errorMsg, type: "error" });
    }
  };

  /* const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: "Eliminar Servicio",
      message: "\u00bfEst\u00e1s seguro de eliminar este servicio? Se eliminar\u00e1n todos los \u00edtems y pagos asociados. Esta acci\u00f3n no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await api.delete(`/services/${id}`);
      fetchData();
      showSnackbar({ message: "Servicio eliminado exitosamente", type: "success" });
    } catch (error) {
      console.error("Error deleting service:", error);
      showSnackbar({ message: "Error al eliminar el servicio", type: "error" });
    }
  };\n*/
  const handleStatusChange = async (id: string, newStatus: ServiceStatus) => {
    if (newStatus === "cancelled") {
      const confirmed = await confirm.confirm({
        title: "Cancelar Servicio",
        message: "¿Estás seguro de cancelar este servicio? Esta acción no se puede deshacer.",
        confirmText: "Sí, cancelar",
        cancelText: "No",
        type: "danger",
      });
      if (!confirmed) return;
    }

    try {
      const service = services.find((s) => s.id === id);
      if (!service) return;

      await api.put(`/services/${id}`, {
        description: service.description,
        items: service.items || [],
        status: newStatus,
      });

      fetchData();
      
      // Show appropriate message based on status change
      if (newStatus === "in_progress") {
        showSnackbar({ message: "Servicio iniciado", type: "success" });
      } else if (newStatus === "completed") {
        showSnackbar({ message: "Servicio completado", type: "success" });
      } else if (newStatus === "cancelled") {
        showSnackbar({ message: "Servicio cancelado", type: "warning" });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showSnackbar({ message: "Error al cambiar el estado del servicio", type: "error" });
    }
  };

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        vehicle_id: service.vehicle_id,
        description: service.description,
        items: service.items && service.items.length > 0 
          ? service.items.map(item => ({ description: item.description, quantity: item.quantity || 1, price: item.price }))
          : [{ description: "", quantity: 1, price: 0 }],
        status: service.status,
      });
    } else {
      setEditingService(null);
      setFormData({
        vehicle_id: "",
        description: "",
        items: [{ description: "", quantity: 1, price: 0 }],
      });
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setError("");
  };

  const openViewModal = (service: Service) => {
    setViewingService(service);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setViewingService(null);
    setShowViewModal(false);
  };

  const addServiceItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }],
    });
  };

  const removeServiceItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const updateServiceItem = (index: number, field: "description" | "quantity" | "price", value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getTotalCost = () => {
    return formData.items.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.price) || 0)), 0);
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: ServiceStatus) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Progreso";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

const getVehicleInfo = (vehicle: Vehicle | undefined) => {
    if (!vehicle) return "N/A";
    
    // Si viene de una "Notita rápida" o no tiene placa completa
    if (vehicle.plate_number === "N/A" || !vehicle.plate_number) {
      return `${vehicle.brand} ${vehicle.model}`.trim() || vehicle.client_name;
    }
    return `${vehicle.brand} ${vehicle.model} - ${vehicle.plate_number}`;
  };

  const filteredServices =
    filterStatus === "all"
      ? services
      : services.filter((s) => s.status === filterStatus);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Servicios</h1>
          <button
            onClick={() => navigate('/quick-ticket')}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Servicio
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Completados
            </button>
          </div>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {getVehicleInfo(service.vehicle)}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      service.status
                    )} w-fit`}
                  >
                    {getStatusLabel(service.status)}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                
                {/* Service Items List */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Servicios realizados:</h4>
                  {service.items && service.items.length > 0 ? (
                    <div className="space-y-2">
                      {service.items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-sm text-gray-600">
                            • {item.quantity > 1 ? `${item.quantity}x ` : ""}{item.description}
                          </span>
                          <span className="text-sm font-medium text-gray-900 ml-4 sm:ml-0">
                            {item.quantity > 1 
                              ? `$${item.price.toFixed(2)} c/u = $${(item.quantity * item.price).toFixed(2)}`
                              : `$${item.price.toFixed(2)}`
                            }
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-gray-300 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">TOTAL:</span>
                        <span className="text-lg font-bold text-primary-600">
                          ${service.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin items especificados</p>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Creado: {new Date(service.created_at).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openViewModal(service)}
                  className="px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-base sm:text-sm transition-colors"
                >
                  Ver
                </button>
                <button
                  onClick={() => {
                    setViewingService(service);
                    setTimeout(handleShare, 800); // 800ms para asegurar que la imagen pesada cargue
                  }}
                  className="px-4 py-3 sm:py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium text-base sm:text-sm transition-colors"
                >
                  Enviar Nota
                </button>
                {service.status !== "completed" && service.status !== "cancelled" && (
                  <>
                    <button
                      onClick={() => openModal(service)}
                      className="px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-base sm:text-sm transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => navigate("/payments", { state: { serviceIdToPay: service.id } })}
                      className="px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-base sm:text-sm transition-colors"
                    >
                      Cobrar
                    </button>
                    <button
                      onClick={() => handleStatusChange(service.id, "cancelled")}
                      className="px-4 py-3 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-base sm:text-sm transition-colors sm:ml-auto"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No hay servicios {filterStatus !== "all" ? getStatusLabel(filterStatus as ServiceStatus).toLowerCase() : ""}</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} servicios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.vehicle_id ? "Vehículo existente vinculado al servicio" : ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción General (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ej: Mantenimiento preventivo, Reparación de motor, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                />
              </div>

              {/* Service Items */}
              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Servicios Realizados *
                  </label>
                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center self-start sm:self-auto"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="w-full">
                        <input
                          type="text"
                          placeholder="Descripción del servicio"
                          value={item.description}
                          onChange={(e) =>
                            updateServiceItem(index, "description", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="1"
                            placeholder="Cantidad"
                            value={item.quantity === 0 ? "" : (item.quantity ?? "")}
                            onChange={(e) =>
                              updateServiceItem(index, "quantity", e.target.value === "" ? 0 : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Precio"
                            value={item.price === 0 ? "" : (item.price ?? "")}
                            onChange={(e) =>
                              updateServiceItem(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeServiceItem(index)}
                            className="text-red-600 hover:text-red-900 p-2"
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

                <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Costo Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${getTotalCost().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-base"
                >
                  {editingService ? "Actualizar" : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Detalle del Servicio</h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer and Vehicle Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Cliente</h3>
                    <p className="font-medium text-gray-900">{viewingService.vehicle?.client_name || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Teléfono</h3>
                    <p className="font-medium text-gray-900">{viewingService.vehicle?.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h3 className="font-semibold text-gray-700 mb-1">Vehículo</h3>
                  <p className="font-medium text-gray-900">{getVehicleInfo(viewingService.vehicle)}</p>
                </div>
              </div>

              {/* Description */}
              {viewingService.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Descripción</h3>
                  <p className="text-gray-900">{viewingService.description}</p>
                </div>
              )}

              {/* Service Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Servicios Realizados</h3>
                {viewingService.items && viewingService.items.length > 0 ? (
                  <div className="space-y-3">
                    {viewingService.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {item.quantity > 1 ? `$${item.price.toFixed(2)} c/u` : `$${item.price.toFixed(2)}`}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-600">= ${(item.quantity * item.price).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                      <span className="text-2xl font-bold text-primary-600">${viewingService.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Sin items especificados</p>
                )}
              </div>

              {/* Status and Date */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingService.status)} mt-1`}>
                      {getStatusLabel(viewingService.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Creación</p>
                    <p className="font-medium text-gray-900 mt-1">{new Date(viewingService.created_at).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={closeViewModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden component for sharing */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {viewingService && <ServiceNotePDF ref={componentToPrintRef} service={viewingService} />}
      </div>
    </Layout>
  );
};

export default Services;

