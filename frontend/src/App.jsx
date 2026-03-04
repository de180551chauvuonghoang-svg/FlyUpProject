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
import MyLearningPage from './pages/MyLearningPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourseBasicsPage from './pages/InstructorCourseBasicsPage';
import InstructorCourseCurriculumPage from './pages/InstructorCourseCurriculumPage';
import InstructorCourseReviewPage from './pages/InstructorCourseReviewPage';
import InstructorUploadPage from './pages/InstructorUploadPage';
import InstructorEditCoursePage from './pages/InstructorEditCoursePage';
import CourseLessonPage from './pages/CourseLessonPage';function App() {
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
          <Route path="/my-learning" element={<MyLearningPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/create-course" element={<InstructorCourseBasicsPage />} />
          <Route path="/instructor/create-course/curriculum" element={<InstructorCourseCurriculumPage />} />
          <Route path="/instructor/create-course/review" element={<InstructorCourseReviewPage />} />
          <Route path="/instructor/upload" element={<InstructorUploadPage />} />
          <Route path="/edit-course/:id" element={<InstructorEditCoursePage />} />
          <Route path="/learning/:courseId" element={<CourseLessonPage />} />
          <Route path="/learning/:courseId/lesson/:lessonId" element={<CourseLessonPage />} />

        </Routes>
        <ChatbotWidget />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;


