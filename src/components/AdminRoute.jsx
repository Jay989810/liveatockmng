import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

const AdminRoute = () => {
    const { user, isAdmin } = useAuth()

    if (!user) return <Navigate to="/login" />

    return isAdmin ? <Outlet /> : <Navigate to="/" />
}

export default AdminRoute
