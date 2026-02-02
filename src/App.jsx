import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Marketplace from './pages/Marketplace'
import ProductDetails from './pages/ProductDetails'
import Orders from './pages/Orders'
import Success from './pages/Success'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Cart from './pages/Cart' // Import Cart
import { Toaster } from 'react-hot-toast'

function App() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar />
            <div className="flex-grow flex flex-col">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/register" element={<Register />} />

                    {/* Public Routes */}
                    <Route path="/" element={<Marketplace />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/orders" element={<Orders />} />

                    {/* Protected User Routes */}
                    <Route element={<PrivateRoute />}>
                    </Route>

                    {/* Protected Admin Routes */}
                    <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>
                </Routes>
            </div>
            <Footer />
        </div>
    )
}

export default App
