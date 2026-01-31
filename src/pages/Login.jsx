import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import toast from 'react-hot-toast'

const Login = () => {
    const { user, setUser } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // Redirect if already logged in (handles the delay after login success)
    useEffect(() => {
        if (user) {
            navigate('/')
        }
    }, [user, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const toastId = toast.loading('Signing in...')

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message, { id: toastId })
                setLoading(false)
            } else {
                // Manual State Update to beat the race condition
                if (data?.session?.user) {
                    setUser(data.session.user)
                }

                toast.success('Welcome back!', { id: toastId })

                // Allow a tiny tick for state to settle, then go. 
                // Using replace: true to prevent back-button loops
                navigate('/', { replace: true })
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An unexpected error occurred', { id: toastId })
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gray-900">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=2073&auto=format&fit=crop"
                    alt="Livestock Background"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Form Container */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-sm text-gray-200">Sign in to manage your trading</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-200">Password</label>
                            <Link to="#" className="text-sm font-medium text-blue-300 hover:text-blue-200">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-300">
                    Don't have an account? <Link to="/register" className="font-bold text-white hover:text-blue-300 hover:underline">Sign up</Link>
                </div>
            </div>
        </div>
    )
}

export default Login
