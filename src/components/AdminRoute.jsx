import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

const AdminRoute = () => {
    const { user, isAdmin } = useAuth()

    if (!user) return <Navigate to="/admin/login" />

    // Strict check: User must be logged in AND be an admin
    return isAdmin ? <Outlet /> : <Navigate to="/" />
}

export default AdminRoute
