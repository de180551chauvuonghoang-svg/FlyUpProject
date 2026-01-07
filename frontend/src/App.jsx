import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import AuthProvider from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/:checkoutId" element={<CheckoutPage />} />
        </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;


