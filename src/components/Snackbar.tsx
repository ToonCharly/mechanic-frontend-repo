import { createContext, useContext, useState, ReactNode } from "react";

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
}

interface SnackbarOptions {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface SnackbarState extends SnackbarOptions {
  id: number;
  isVisible: boolean;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snackbars, setSnackbars] = useState<SnackbarState[]>([]);

  const showSnackbar = (options: SnackbarOptions) => {
    const id = Date.now();
    const snackbar: SnackbarState = {
      ...options,
      id,
      type: options.type || "info",
      duration: options.duration || 3000,
      isVisible: true,
    };

    setSnackbars((prev) => [...prev, snackbar]);

    // Auto-hide after duration
    setTimeout(() => {
      setSnackbars((prev) => 
        prev.map((s) => (s.id === id ? { ...s, isVisible: false } : s))
      );
      
      // Remove from DOM after animation
      setTimeout(() => {
        setSnackbars((prev) => prev.filter((s) => s.id !== id));
      }, 300);
    }, snackbar.duration);
  };

  const handleClose = (id: number) => {
    setSnackbars((prev) => 
      prev.map((s) => (s.id === id ? { ...s, isVisible: false } : s))
    );
    
    setTimeout(() => {
      setSnackbars((prev) => prev.filter((s) => s.id !== id));
    }, 300);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "warning":
        return (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default: // info
        return (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      case "warning":
        return "bg-yellow-600";
      default:
        return "bg-blue-600";
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      {/* Snackbar container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {snackbars.map((snackbar) => (
          <div
            key={snackbar.id}
            className={`${getBackgroundColor(snackbar.type!)} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md transition-all duration-300 ${
              snackbar.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            }`}
          >
            <div className="flex-shrink-0">
              {getIcon(snackbar.type!)}
            </div>
            <p className="flex-1 text-sm font-medium">{snackbar.message}</p>
            <button
              onClick={() => handleClose(snackbar.id)}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
};
