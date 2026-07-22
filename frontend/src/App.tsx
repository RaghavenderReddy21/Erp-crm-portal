import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CustomersListPage from "./pages/CustomersListPage";
import CustomerFormPage from "./pages/CustomerFormPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ChallansListPage from "./pages/ChallansListPage";
import ChallanFormPage from "./pages/ChallanFormPage";
import ChallanDetailPage from "./pages/ChallanDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<Navigate to="/customers" replace />} />

      <Route path="/customers" element={<ProtectedRoute><CustomersListPage /></ProtectedRoute>} />
      <Route path="/customers/new" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
      <Route path="/customers/:id/edit" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />

      <Route path="/products" element={<ProtectedRoute><ProductsListPage /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />

      <Route path="/challans" element={<ProtectedRoute><ChallansListPage /></ProtectedRoute>} />
      <Route path="/challans/new" element={<ProtectedRoute><ChallanFormPage /></ProtectedRoute>} />
      <Route path="/challans/:id" element={<ProtectedRoute><ChallanDetailPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
