import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { api } from "../services/api";
import { Vehicle } from "../types/vehicle";
import { Service } from "../types/service";

interface DashboardStats {
  totalVehicles: number;
  pendingServices: number;
  inProgressServices: number;
  completedServices: number;
  cancelledServices: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    pendingServices: 0,
    inProgressServices: 0,
    completedServices: 0,
    cancelledServices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [vehiclesRes, servicesRes] = await Promise.all([
          api.get<{ data: Vehicle[] }>("/vehicles?limit=5000"),
          api.get<{ data: Service[] }>("/services?limit=5000"),
      ]);

      const vehicles = vehiclesRes.data.data;
      const services = servicesRes.data.data;

      setStats({
        totalVehicles: vehicles.length,
        pendingServices: services.filter((s) => s.status === "pending" || s.status === "in_progress").length,
        inProgressServices: 0,
        completedServices: services.filter((s) => s.status === "completed").length,
        cancelledServices: services.filter((s) => s.status === "cancelled").length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="hidden bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-blue-100 p-3">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Total Vehículos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalVehicles}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-yellow-100 p-3">
                  <svg
                    className="h-8 w-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Servicios Pendientes
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.pendingServices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Completados
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completedServices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-400">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-red-100 p-3">
                  <svg
                    className="h-8 w-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Cancelados
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.cancelledServices}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 hidden md:block">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/quick-ticket"
              className="flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg
                className="h-6 w-6 mr-2"
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
              Nota de Servicio
            </Link>
            <Link
              to="/payments"
              className="flex items-center justify-center px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg
                className="h-6 w-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Registrar Pago
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
