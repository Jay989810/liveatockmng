import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import toast from 'react-hot-toast'

const AdminLogin = () => {
    const { user, setUser, checkAdmin } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const mounted = useRef(true)

    useEffect(() => {
        return () => { mounted.current = false }
    }, [])

    useEffect(() => {
        // If already logged in, check if admin and redirect accordingly
        const verifyAdminElement = async () => {
            if (user) {
                const isAdmin = await checkAdmin(user.id)
                if (isAdmin) {
                    navigate('/admin')
                } else {
                    toast.error("Access Denied: You are not an admin.")
                    await supabase.auth.signOut()
                    setUser(null)
                }
            }
        }
        verifyAdminElement()
    }, [user, navigate, checkAdmin, setUser])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const toastId = toast.loading('Verifying Admin Credentials...')

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message, { id: toastId })
            } else {
                if (data?.session?.user) {
                    // Check if this user is actually an admin
                    const isAdmin = await checkAdmin(data.session.user.id)

                    if (isAdmin) {
                        setUser(data.session.user)
                        toast.success('Welcome Administrator', { id: toastId })
                        navigate('/admin', { replace: true })
                    } else {
                        // Not an admin - log them out immediately
                        await supabase.auth.signOut()
                        toast.error('Access Denied: Admin privileges required.', { id: toastId })
                    }
                }
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An unexpected error occurred', { id: toastId })
        } finally {
            if (mounted.current) setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gray-900 font-sans">
            {/* Darker, more serious background for Admin */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>

            {/* Form Container */}
            <div className="relative z-10 w-full max-w-md p-10 bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50">
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Admin Portal</h1>
                    <p className="text-gray-400 text-sm">Restricted Access. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            placeholder="admin@livestock.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                    <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-white transition-colors">
                        &larr; Return to Marketplace
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
