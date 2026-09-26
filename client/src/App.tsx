import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AuthLayout from "./pages/auth/AuthLayout"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"

import { AuthProvider, useAuth } from "./lib/auth"

import AppLayout from "./components/layout/AppLayout"
import Dashboard from "./pages/dashboard/Dashboard"
import ProductsList from "./pages/products/ProductsList"
import CategoriesList from "./pages/products/CategoriesList"
import StockList from "./pages/products/StockList"
import ReceiptsList from "./pages/operations/ReceiptsList"
import DeliveriesList from "./pages/operations/DeliveriesList"
import InternalTransfersList from "./pages/operations/InternalTransfersList"
import AdjustmentsList from "./pages/operations/AdjustmentsList"
import MoveHistory from "./pages/operations/MoveHistory"
import { io } from "socket.io-client"
import { useEffect } from "react"

export const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
  withCredentials: true,
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Real-time sync listener
  useEffect(() => {
    if (!user) return;
    
    socket.on("stock-update", () => {
      // Basic implementation: reload page on stock update
      // In a real app we would invalidate react-query caches
      // window.location.reload(); 
    });

    socket.on("operation-update", () => {
      // window.location.reload();
    });

    return () => {
      socket.off("stock-update");
      socket.off("operation-update");
    };
  }, [user]);

  if (loading) return <div>Loading...</div>; // Could be a nicer spinner
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="stock" element={<StockList />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="receipts" element={<ReceiptsList />} />
            <Route path="deliveries" element={<DeliveriesList />} />
            <Route path="internal" element={<InternalTransfersList />} />
            <Route path="adjustments" element={<AdjustmentsList />} />
            <Route path="history" element={<MoveHistory />} />
            <Route path="settings/*" element={<div>Settings</div>} />
          </Route>
          
          {/* Default route for now redirects to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
