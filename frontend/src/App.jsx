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
// NEW: question bank module
import QuestionBankListPage from './pages/QuestionBankListPage';
import InstructorRoute from './components/Auth/InstructorRoute';
//finish for question bank module
import QuestionBankDetailPage from './pages/QuestionBankDetailPage';
import CreateAssignmentFromBankPage from './pages/CreateAssignmentFromBankPage';
import AssignmentSnapshotPreviewPage from './pages/AssignmentSnapshotPreviewPage';
import InstructorPreviewPage from './pages/InstructorPreviewPage';
import CourseLessonPage from './pages/CourseLessonPage';
import InstructorStudentsPage from './pages/InstructorStudentsPage';
import InstructorCommunicationPage from './pages/InstructorCommunicationPage';
import InstructorToolsPage from './pages/InstructorToolsPage';


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerStyle={{ top: 75 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1333',
                color: '#fff',
                padding: '16px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                fontSize: '15px',
                fontWeight: '500',
                letterSpacing: '0.02em',
                maxWidth: '400px',
                zIndex: 9999
              },
              success: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#065f46',
                },
                style: {
                  background: '#065f46', // Emerald 800
                  color: '#fff',
                  border: '1px solid #10b981', // Emerald 500
                },
              },
              error: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#991b1b',
                },
                style: {
                  background: '#991b1b', // Red 800
                  color: '#fff',
                  border: '1px solid #ef4444', // Red 500
                },
              },
              loading: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#5b21b6',
                },
                style: {
                  background: '#5b21b6', // Violet 800
                  color: '#fff',
                  border: '1px solid #8b5cf6', // Violet 500
                },
              },
            }}
          />
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
            <Route path="/instructor/preview/:id" element={<InstructorPreviewPage />} />
            <Route path="/instructor/students" element={<InstructorStudentsPage />} />
            <Route path="/instructor/communication" element={<InstructorCommunicationPage />} />
            <Route path="/instructor/tools" element={<InstructorToolsPage />} />
            <Route path="/learning/:courseId" element={<CourseLessonPage />} />
            <Route path="/learning/:courseId/lesson/:lessonId" element={<CourseLessonPage />} />
            <Route
              path="/instructor/question-banks"
              element={
                <InstructorRoute>
                  <QuestionBankListPage />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/question-banks/:id"
              element={
                <InstructorRoute>
                  <QuestionBankDetailPage />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/create-assignment-from-bank"
              element={
                <InstructorRoute>
                  <CreateAssignmentFromBankPage />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/assignments/:assignmentId/preview"
              element={
                <InstructorRoute>
                  <AssignmentSnapshotPreviewPage />
                </InstructorRoute>
              }
            />
          </Routes>
          <ChatbotWidget />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
export default App;
