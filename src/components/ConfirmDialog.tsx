import { createContext, useContext, useState, ReactNode } from "react";

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context;
};

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "info",
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      ...opts,
      confirmText: opts.confirmText || "Confirmar",
      cancelText: opts.cancelText || "Cancelar",
      type: opts.type || "info",
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const getIconColor = () => {
    switch (options.type) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  const getButtonColor = () => {
    switch (options.type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      default:
        return "bg-primary-600 hover:bg-primary-700";
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideUp">
            <div className="p-6">
              {/* Icon */}
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                options.type === "danger" ? "bg-red-100" : 
                options.type === "warning" ? "bg-yellow-100" : 
                "bg-blue-100"
              }`}>
                {options.type === "danger" ? (
                  <svg
                    className={`h-6 w-6 ${getIconColor()}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : options.type === "warning" ? (
                  <svg
                    className={`h-6 w-6 ${getIconColor()}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`h-6 w-6 ${getIconColor()}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              {/* Title */}
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {options.title}
                </h3>
                {/* Message */}
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{options.message}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse gap-3 rounded-b-lg">
              <button
                onClick={handleConfirm}
                className={`${getButtonColor()} text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              >
                {options.confirmText}
              </button>
              <button
                onClick={handleCancel}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {options.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};
