import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AuthLayout from "./pages/auth/AuthLayout"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"

import { AuthProvider, useAuth } from "./lib/auth"
import { invalidateInventory } from "./lib/queryKeys"

import AppLayout from "./components/layout/AppLayout"
import Dashboard from "./pages/dashboard/Dashboard"
import ProductsList from "./pages/products/ProductsList"
import CategoriesList from "./pages/products/CategoriesList"
import StockList from "./pages/products/StockList"
import ReceiptsList from "./pages/operations/ReceiptsList"
import ReceiptForm from "./pages/operations/ReceiptForm"
import DeliveriesList from "./pages/operations/DeliveriesList"
import DeliveryForm from "./pages/operations/DeliveryForm"
import InternalTransfersList from "./pages/operations/InternalTransfersList"
import InternalTransferForm from "./pages/operations/InternalTransferForm"
import AdjustmentsList from "./pages/operations/AdjustmentsList"
import AdjustmentForm from "./pages/operations/AdjustmentForm"
import MoveHistory from "./pages/operations/MoveHistory"
import Warehouses from "./pages/settings/Warehouses"
import Locations from "./pages/settings/Locations"
import Contacts from "./pages/settings/Contacts"
import Profile from "./pages/settings/Profile"
import { io } from "socket.io-client"
import { useEffect } from "react"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"

export const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
  withCredentials: true,
})

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  
  // Real-time sync listener
  useEffect(() => {
    if (!user) return;
    
    const handleInventoryUpdate = () => {
      invalidateInventory(queryClient);
    };

    const handleMasterUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    };

    socket.on("stock-update", handleInventoryUpdate);
    socket.on("operation-update", handleInventoryUpdate);
    socket.on("stock:changed", handleInventoryUpdate);
    socket.on("operation:changed", handleInventoryUpdate);
    socket.on("master:changed", handleMasterUpdate);

    return () => {
      socket.off("stock-update", handleInventoryUpdate);
      socket.off("operation-update", handleInventoryUpdate);
      socket.off("stock:changed", handleInventoryUpdate);
      socket.off("operation:changed", handleInventoryUpdate);
      socket.off("master:changed", handleMasterUpdate);
    };
  }, [user, queryClient]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="receipts/:id" element={<ReceiptForm />} />
            <Route path="deliveries" element={<DeliveriesList />} />
            <Route path="deliveries/:id" element={<DeliveryForm />} />
            <Route path="internal" element={<InternalTransfersList />} />
            <Route path="internal/:id" element={<InternalTransferForm />} />
            <Route path="adjustments" element={<AdjustmentsList />} />
            <Route path="adjustments/:id" element={<AdjustmentForm />} />
            <Route path="history" element={<MoveHistory />} />
            <Route path="settings/warehouses" element={<Warehouses />} />
            <Route path="settings/locations" element={<Locations />} />
            <Route path="settings/contacts" element={<Contacts />} />
            <Route path="settings/profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
