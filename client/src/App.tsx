import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AuthLayout from "./pages/auth/AuthLayout"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import ForgotPassword from "./pages/auth/ForgotPassword"

import { AuthProvider, useAuth } from "./lib/auth"

import AppLayout from "./components/layout/AppLayout"
import ProductsList from "./pages/products/ProductsList"
import CategoriesList from "./pages/products/CategoriesList"
import StockList from "./pages/products/StockList"
import ReceiptsList from "./pages/operations/ReceiptsList"
import DeliveriesList from "./pages/operations/DeliveriesList"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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
            <Route index element={<div>Dashboard</div>} />
            <Route path="products" element={<ProductsList />} />
            <Route path="stock" element={<StockList />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="receipts" element={<ReceiptsList />} />
            <Route path="deliveries" element={<DeliveriesList />} />
            <Route path="internal" element={<div>Internal Transfers</div>} />
            <Route path="adjustments" element={<div>Adjustments</div>} />
            <Route path="history" element={<div>Move History</div>} />
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
