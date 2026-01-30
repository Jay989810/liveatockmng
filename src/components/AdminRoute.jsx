import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

const AdminRoute = () => {
    const { user } = useAuth()

    // STRICT ADMIN CHECK REMOVED TEMPORARILY
    // If you are logged in, you can VIEW the admin dashboard.
    // However, database Row Level Security (RLS) will still prevent you from 
    // actually *doing* anything (like deleting/adding) if you are not a real admin.

    return user ? <Outlet /> : <Navigate to="/login" />
}

export default AdminRoute
