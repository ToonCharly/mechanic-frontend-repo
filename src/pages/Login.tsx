import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useSnackbar } from "../components/Snackbar";

const LOGIN_EMAIL_KEY = "login_email_draft";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Restore email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(LOGIN_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Save email to localStorage as user types
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      localStorage.setItem(LOGIN_EMAIL_KEY, value);
    } else {
      localStorage.removeItem(LOGIN_EMAIL_KEY);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      // Clear saved email on successful login
      localStorage.removeItem(LOGIN_EMAIL_KEY);
      navigate("/");
    } catch (err: unknown) {
      const errorMsg =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: unknown } } }).response
          ?.data?.error === "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error || "Error al iniciar sesión. Verifica tus credenciales."
          : "Error al iniciar sesión. Verifica tus credenciales.";
      setError(errorMsg);
      showSnackbar({ message: errorMsg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-center text-4xl font-extrabold text-gray-900">
            Taller Mecanico Champion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa a tu cuenta
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
