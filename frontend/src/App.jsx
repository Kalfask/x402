import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import AuthCallback from './pages/AuthCallBack';
import ApiDetail from './pages/ApiDetail';
import CreateListing from './pages/CreateListing';
import MyApis from './pages/MyApis';
import Usage from './pages/Usage';
import Earnings from './pages/Earnings';
import EditApi from './pages/EditApi';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/auth/callback' element={<AuthCallback />} />
          <Route path='/marketplace/:id' element={<ApiDetail />} />

          {/* Protected routes — require JWT */}
          <Route path='/sell' element={
            <ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path='/my-apis/:id/edit' element={
            <ProtectedRoute><EditApi /></ProtectedRoute>} />
          <Route path='/my-apis' element={
            <ProtectedRoute><MyApis /></ProtectedRoute>} />
          <Route path='/usage' element={
            <ProtectedRoute><Usage /></ProtectedRoute>} />
          <Route path='/earnings' element={
            <ProtectedRoute><Earnings /></ProtectedRoute>} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
