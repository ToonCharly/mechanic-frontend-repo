import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useConfirm } from "./ConfirmDialog";
import { useState } from "react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path
      ? "bg-primary-700 text-white"
      : "text-gray-300 hover:bg-primary-600 hover:text-white";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "mechanic":
        return "Mecánico";
      default:
        return role;
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm.confirm({
      title: "Cerrar Sesión",
      message: "¿Estás seguro de que quieres cerrar sesión?",
      confirmText: "Sí, cerrar sesión",
      cancelText: "Cancelar",
      type: "warning",
    });

    if (!confirmed) return;

    try {
      await logout();
      // Redirect to login after successful logout
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-primary-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y menú desktop */}
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-white text-xl sm:text-2xl font-bold">Taller Mecanico Champion</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className={`${isActive(
                    "/"
                  )} px-4 py-2 rounded-md text-base font-medium transition-colors`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/services"
                  className={`${isActive(
                    "/services"
                  )} px-4 py-2 rounded-md text-base font-medium transition-colors`}
                >
                  Servicios
                </Link>
                <Link
                  to="/payments"
                  className={`${isActive(
                    "/payments"
                  )} px-4 py-2 rounded-md text-base font-medium transition-colors`}
                >
                  Pagos
                </Link>
              </div>
            </div>
          </div>

          {/* Usuario y logout - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-white text-sm">
              <span className="font-medium">Bienvenido, {user?.name}</span>
              <span className="ml-2 text-xs text-gray-300">
                ({getRoleLabel(user?.role)})
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Botón hamburguesa - Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`${isActive("/")} block px-3 py-3 rounded-md text-base font-medium`}
            >
              Dashboard
            </Link>
            <Link
              to="/services"
              onClick={() => setIsMenuOpen(false)}
              className={`${isActive("/services")} block px-3 py-3 rounded-md text-base font-medium`}
            >
              Servicios
            </Link>
            <Link
              to="/payments"
              onClick={() => setIsMenuOpen(false)}
              className={`${isActive("/payments")} block px-3 py-3 rounded-md text-base font-medium`}
            >
              Pagos
            </Link>
          </div>
          <div className="border-t border-primary-600 px-4 py-3 space-y-2">
            <Link
              to="/quick-ticket"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nota de Servicio
            </Link>
            <Link
              to="/payments"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Registrar Pago
            </Link>
          </div>
          <div className="border-t border-primary-600 px-4 py-3">
            <div className="text-white text-sm mb-3">
              <span className="font-medium">{user?.name}</span>
              <span className="ml-2 text-xs text-gray-300">
                ({getRoleLabel(user?.role)})
              </span>
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
