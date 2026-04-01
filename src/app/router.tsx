import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { Services } from "../pages/Services";
import { Payments } from "../pages/Payments";
import QuickTicket from "../pages/QuickTicket";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quick-ticket"
          element={
            <ProtectedRoute>
              <QuickTicket />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
