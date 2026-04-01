import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../services/api";
import { Payment, PaymentMethod, CreatePaymentRequest } from "../types/payment";
import { Service } from "../types/service";
import { Vehicle } from "../types/vehicle";
import { useSnackbar } from "../components/Snackbar";
import { AxiosError } from "axios";

export const Payments = () => {
  const location = useLocation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [viewingServicePayments, setViewingServicePayments] = useState<{ serviceId: string; payments: Payment[] } | null>(null);
  const [error, setError] = useState("");
  const { showSnackbar } = useSnackbar();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    service_id: "",
    amount: 0,
    payment_method: "cash",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, servicesRes, vehiclesRes] = await Promise.all([
        api.get<{ data: Payment[] }>("/payments"),
        api.get<{ data: Service[] }>("/services"),
        api.get<{ data: Vehicle[] }>("/vehicles"),
      ]);
      setPayments(paymentsRes.data.data);
      setServices(servicesRes.data.data);
      setVehicles(vehiclesRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/payments", formData);
      try {
        const serviceToUpdate = services.find((s) => s.id === formData.service_id);
        if (serviceToUpdate && serviceToUpdate.status !== "completed") {
          await api.put(`/services/${serviceToUpdate.id}`, {
            vehicle_id: serviceToUpdate.vehicle_id,
            description: serviceToUpdate.description,
            items: serviceToUpdate.items || [],
            status: "completed",
          });
        }
      } catch (err) {
        console.error("Warning: Could not update service status to completed", err);
      }
      fetchData();
      closeModal();
      showSnackbar({ message: "Pago registrado exitosamente", type: "success" });
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMsg = error.response?.data?.error || "Error al registrar el pago";
      setError(errorMsg);
      showSnackbar({ message: errorMsg, type: "error" });
    }
  };

  const openViewModal = (payment: Payment) => {
    setViewingPayment(payment);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setViewingPayment(null);
    setShowViewModal(false);
  };

  const openServicePaymentsModal = (serviceId: string) => {
    const servicePayments = payments.filter((p) => p.service_id === serviceId);
    setViewingServicePayments({ serviceId, payments: servicePayments });
  };

  const closeServicePaymentsModal = () => setViewingServicePayments(null);

  const openPaymentModal = (serviceId?: string) => {
    // Get services with pending payments
    const pendingServices = services.filter((service) => {
      const pending = getPendingAmount(service.id);
      return pending > 0 && service.status !== "cancelled";
    });

    // If serviceId provided, use it; otherwise auto-select if only one pending
    let selectedServiceId = serviceId || "";
    if (!serviceId && pendingServices.length === 1) {
      selectedServiceId = pendingServices[0].id;
    }

    if (selectedServiceId) {
      const pending = getPendingAmount(selectedServiceId);
      setFormData({
        service_id: selectedServiceId,
        amount: pending > 0 ? pending : 0,
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } else {
      setFormData({
        service_id: "",
        amount: 0,
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setError("");
    setShowModal(true);
  };

  useEffect(() => {
    if (!isLoading && location.state?.serviceIdToPay) {
      openPaymentModal(location.state.serviceIdToPay);
      // Limpiamos el state para que no se vuelva a abrir el modal si el usuario refresca la página
      window.history.replaceState({}, document.title);
    }
  }, [isLoading, location.state]);

  const closeModal = () => {
    setShowModal(false);
    setError("");
  };

  const getServiceInfo = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.description : "N/A";
  };

  const getVehicleInfo = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return "Vehículo Desconocido";
    const vehicle = vehicles.find((v) => v.id === service.vehicle_id);
    if (!vehicle) return "Vehículo Desconocido";
    
    if (!vehicle.plate_number || vehicle.plate_number === "N/A") {
      return `${vehicle.brand} ${vehicle.model}`.trim() || vehicle.client_name;
    }
    return `${vehicle.brand} ${vehicle.model} - ${vehicle.plate_number}`;
  };

  const getClientInfo = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return "";
    const vehicle = vehicles.find((v) => v.id === service.vehicle_id);
    if (!vehicle) return "";
    return `${vehicle.client_name} · ${vehicle.phone}`;
  };

  // Helpers using embedded payment data (for history display)
  const paymentVehicleLabel = (p: Payment) => {
    const v = p.service?.vehicle;
    if (v) {
      if (!v.plate_number || v.plate_number === "N/A") {
        return `${v.brand} ${v.model}`.trim() || v.client_name;
      }
      return `${v.brand} ${v.model} - ${v.plate_number}`;
    }
    return getVehicleInfo(p.service_id);
  };

  const paymentClientLabel = (p: Payment) => {
    const v = p.service?.vehicle;
    return v ? `${v.client_name} · ${v.phone}` : "";
  };

  const paymentServiceDescription = (p: Payment) =>
    p.service?.description || getServiceInfo(p.service_id) || "";

  const paymentServiceItems = (p: Payment) => p.service?.items || [];

  const paymentServiceCost = (p: Payment) => p.service?.cost ?? getServiceCost(p.service_id);

  const getServiceCost = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.cost : 0;
  };

  const getTotalPaid = (serviceId: string) => {
    return payments
      .filter((p) => p.service_id === serviceId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getPendingAmount = (serviceId: string) => {
    const cost = getServiceCost(serviceId);
    const paid = getTotalPaid(serviceId);
    return cost - paid;
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "card":
        return "Tarjeta";
      case "transfer":
        return "Transferencia";
      case "other":
        return "Otro";
      default:
        return method;
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  // Build display items: consolidate fully-paid services into one entry
  type DisplayItem =
    | { type: 'individual'; payment: Payment }
    | { type: 'consolidated'; serviceId: string; servicePayments: Payment[]; totalPaid: number };

  const consolidatedServiceIds = new Set<string>();
  const displayItems: DisplayItem[] = [];
  payments.forEach((payment) => {
    const pending = getPendingAmount(payment.service_id);
    if (pending <= 0) {
      if (!consolidatedServiceIds.has(payment.service_id)) {
        consolidatedServiceIds.add(payment.service_id);
        const servicePayments = payments.filter((p) => p.service_id === payment.service_id);
        displayItems.push({ type: 'consolidated', serviceId: payment.service_id, servicePayments, totalPaid: servicePayments.reduce((s, p) => s + p.amount, 0) });
      }
    } else {
      displayItems.push({ type: 'individual', payment });
    }
  });

  const totalPages = Math.max(1, Math.ceil(displayItems.length / itemsPerPage));
  const pagedItems = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // Get services with pending payments (not fully paid and not cancelled)
  const servicesWithPendingPayments = services.filter((service) => {
    const pending = getPendingAmount(service.id);
    return pending > 0 && service.status !== "cancelled";
  });

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pagos</h1>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-base sm:text-lg font-medium mb-2">Total Recaudado</h2>
          <p className="text-3xl sm:text-4xl font-bold">${totalAmount.toFixed(2)}</p>
          <p className="text-sm mt-2 opacity-90">
            {payments.length} pagos registrados
          </p>
        </div>

        {/* Services with Pending Payments */}
        {servicesWithPendingPayments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              🔔 Servicios Pendientes de Pago
            </h2>
            <div className="space-y-3">
              {servicesWithPendingPayments.map((service) => {
                const pending = getPendingAmount(service.id);
                const paid = getTotalPaid(service.id);
                const total = service.cost;
                const percentPaid = (paid / total) * 100;

                return (
                  <div
                    key={service.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {getVehicleInfo(service.id)}
                        </h3>
                        {getClientInfo(service.id) && (
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            👤 {getClientInfo(service.id)}
                          </p>
                        )}
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                        )}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Costo Total:</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pagado:</span>
                            <span className="font-medium text-green-600">${paid.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pendiente:</span>
                            <span className="font-bold text-red-600">${pending.toFixed(2)}</span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {percentPaid.toFixed(0)}% pagado
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openPaymentModal(service.id)}
                        className="w-full sm:w-auto sm:ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap"
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
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Cobrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Historial de Pagos</h2>
          </div>

          {/* Cards móvil */}
          <div className="block md:hidden p-4 space-y-4">
            {pagedItems.map((item) => {
              if (item.type === 'consolidated') {
                const lastPayment = item.servicePayments[0];
                const samplePayment = item.servicePayments[item.servicePayments.length - 1];
                return (
                  <div key={`consolidated-${item.serviceId}`} className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{paymentVehicleLabel(samplePayment)}</h3>
                        {paymentClientLabel(samplePayment) && (
                          <p className="text-xs text-gray-500 mt-0.5">{paymentClientLabel(samplePayment)}</p>
                        )}
                        {paymentServiceDescription(samplePayment) && (
                          <p className="text-xs text-gray-600 mt-1 italic">{paymentServiceDescription(samplePayment)}</p>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-lg font-bold text-green-600">${item.totalPaid.toFixed(2)}</span>
                        <div><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Pagado</span></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {item.servicePayments.length} pago{item.servicePayments.length > 1 ? 's' : ''} · último: {new Date(lastPayment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button
                      onClick={() => openServicePaymentsModal(item.serviceId)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                      Ver Pagos ({item.servicePayments.length})
                    </button>
                  </div>
                );
              }
              const payment = item.payment;
              const pending = getPendingAmount(payment.service_id);
              const items = paymentServiceItems(payment);
              return (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{paymentVehicleLabel(payment)}</h3>
                      {paymentClientLabel(payment) && (
                        <p className="text-xs text-gray-500 mt-0.5">{paymentClientLabel(payment)}</p>
                      )}
                      {paymentServiceDescription(payment) && (
                        <p className="text-xs text-gray-600 mt-1 italic">{paymentServiceDescription(payment)}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-green-600 ml-2">${payment.amount.toFixed(2)}</span>
                  </div>
                  {items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-3 space-y-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">{it.quantity > 1 ? `${it.quantity}x ` : ""}{it.description}</span>
                          <span className="font-medium text-gray-800">${(it.quantity * it.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{new Date(payment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método:</span>
                      <span className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo Restante:</span>
                      {pending > 0 ? (
                        <span className="text-red-600 font-medium">${pending.toFixed(2)}</span>
                      ) : (
                        <span className="text-green-600 font-medium">✓ Pagado</span>
                      )}
                    </div>
                    {payment.notes && (
                      <div className="pt-1.5 border-t border-gray-200">
                        <span className="text-gray-500 text-xs block">Notas: {payment.notes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openViewModal(payment)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Ver Detalle Completo
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tabla desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Restante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedItems.map((item) => {
                  if (item.type === 'consolidated') {
                    const lastPayment = item.servicePayments[0];
                    const samplePayment = item.servicePayments[item.servicePayments.length - 1];
                    return (
                      <tr key={`consolidated-${item.serviceId}`} className="hover:bg-green-50 bg-green-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(lastPayment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{paymentVehicleLabel(samplePayment)}</div>
                          {paymentClientLabel(samplePayment) && <div className="text-xs text-gray-500">{paymentClientLabel(samplePayment)}</div>}
                          {paymentServiceDescription(samplePayment) && <div className="text-xs text-gray-500 italic">{paymentServiceDescription(samplePayment)}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                          ${item.totalPaid.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.servicePayments.length} pago{item.servicePayments.length > 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ Pagado</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openServicePaymentsModal(item.serviceId)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            Ver pagos ({item.servicePayments.length})
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  const payment = item.payment;
                  const pending = getPendingAmount(payment.service_id);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{paymentVehicleLabel(payment)}</div>
                        {paymentClientLabel(payment) && <div className="text-xs text-gray-500">{paymentClientLabel(payment)}</div>}
                        {paymentServiceDescription(payment) && <div className="text-xs text-gray-500 italic">{paymentServiceDescription(payment)}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pending > 0 ? (
                          <span className="text-red-600 font-medium">${pending.toFixed(2)}</span>
                        ) : (
                          <span className="text-green-600 font-medium">✓ Pagado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.notes || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openViewModal(payment)}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay pagos registrados
              </p>
            </div>
          )}
          {displayItems.length > itemsPerPage && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, displayItems.length)} de {displayItems.length} registros
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Página {currentPage} de {totalPages}</span>
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Registrar Pago</h2>
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
              {formData.service_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">
                      {getVehicleInfo(formData.service_id)}
                    </p>
                    {getClientInfo(formData.service_id) && (
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        👤 {getClientInfo(formData.service_id)}
                      </p>
                    )}
                    {getServiceInfo(formData.service_id) && (
                      <p className="text-sm text-gray-600 mt-2">
                        {getServiceInfo(formData.service_id)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {formData.service_id && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Costo Total:</span>
                    <span className="font-medium">${getServiceCost(formData.service_id).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Ya Pagado:</span>
                    <span className="font-medium text-green-600">${getTotalPaid(formData.service_id).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-bold text-gray-900">Pendiente:</span>
                    <span className="font-bold text-red-600">${getPendingAmount(formData.service_id).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  required
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-base"
                >
                  Registrar
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

      {/* View Service Payments Modal (consolidated) */}
      {viewingServicePayments && (() => {
        const samplePayment = viewingServicePayments.payments[viewingServicePayments.payments.length - 1];
        const vehicle = samplePayment?.service?.vehicle;
        const svcItems = paymentServiceItems(samplePayment);
        const svcDescription = paymentServiceDescription(samplePayment);
        const svcCost = paymentServiceCost(samplePayment);
        const totalPaid = viewingServicePayments.payments.reduce((s, p) => s + p.amount, 0);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold">Historial de Pagos</h2>
                <button type="button" onClick={closeServicePaymentsModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vehicle + Client */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
                <p className="font-bold text-gray-900">{paymentVehicleLabel(samplePayment)}</p>
                {vehicle && <p className="text-sm text-gray-600">{vehicle.client_name} · {vehicle.phone}</p>}
                {vehicle && <p className="text-xs text-gray-500">{vehicle.color} · {vehicle.year}</p>}
              </div>

              {/* Service Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Servicio Realizado</p>
                {svcDescription && <p className="text-sm text-gray-700 mb-3">{svcDescription}</p>}
                {svcItems.length > 0 && (
                  <div className="space-y-1.5">
                    {svcItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{it.quantity > 1 ? `${it.quantity}x ` : ""}{it.description}</span>
                        <span className="font-medium text-gray-900">${(it.quantity * it.price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-blue-200 flex justify-between font-semibold text-sm">
                      <span>Costo Total del Servicio</span>
                      <span>${svcCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual payments */}
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pagos Realizados</p>
              <div className="space-y-2 mb-4">
                {viewingServicePayments.payments.map((payment, index) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-medium">Pago #{viewingServicePayments.payments.length - index}</span>
                      <span className="font-bold text-green-600">${payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div><span className="text-gray-500">Fecha: </span><span className="font-medium">{new Date(payment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div><span className="text-gray-500">Método: </span><span className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</span></div>
                    </div>
                    {payment.notes && <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded p-2">{payment.notes}</p>}
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Pagado</span>
                <span className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</span>
              </div>

              <button type="button" onClick={closeServicePaymentsModal} className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* View Payment Modal */}
      {showViewModal && viewingPayment && (() => {
        const vehicle = viewingPayment.service?.vehicle;
        const items = paymentServiceItems(viewingPayment);
        const svcCost = paymentServiceCost(viewingPayment);
        const pending = getPendingAmount(viewingPayment.service_id);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold">Detalle del Pago</h2>
                <button type="button" onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Payment highlight */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 font-medium">Monto Pagado</p>
                  <p className="text-3xl font-bold text-green-600">${viewingPayment.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">{new Date(viewingPayment.payment_date).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {getPaymentMethodLabel(viewingPayment.payment_method)}</p>
                </div>

                {/* Vehicle + Client */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vehículo</p>
                  <p className="font-bold text-gray-900">{paymentVehicleLabel(viewingPayment)}</p>
                  {vehicle && (
                    <>
                      <p className="text-sm text-gray-600 mt-1">{vehicle.client_name} · {vehicle.phone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{vehicle.color} · {vehicle.year}</p>
                    </>
                  )}
                </div>

                {/* Service */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Servicio Realizado</p>
                  {paymentServiceDescription(viewingPayment) && (
                    <p className="text-sm text-gray-700 mb-3">{paymentServiceDescription(viewingPayment)}</p>
                  )}
                  {items.length > 0 ? (
                    <div className="space-y-1.5">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{it.quantity > 1 ? `${it.quantity}x ` : ""}{it.description}</span>
                          <span className="font-medium">{it.quantity > 1 ? `$${it.price.toFixed(2)} = ` : ""}<span className="text-gray-900">${(it.quantity * it.price).toFixed(2)}</span></span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-blue-200 flex justify-between font-semibold text-sm">
                        <span>Costo Total</span>
                        <span>${svcCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin items registrados</p>
                  )}
                </div>

                {/* Payment status */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado del Pago</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Este pago</span>
                    <span className="font-bold text-green-600">${viewingPayment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Saldo Restante</span>
                    {pending > 0 ? (
                      <span className="font-bold text-red-600">${pending.toFixed(2)}</span>
                    ) : (
                      <span className="font-bold text-green-600">✓ Completamente Pagado</span>
                    )}
                  </div>
                  {viewingPayment.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Notas</p>
                      <p className="text-sm text-gray-900 bg-white rounded p-2 border border-gray-200">{viewingPayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <button type="button" onClick={closeViewModal} className="w-full mt-5 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
};
