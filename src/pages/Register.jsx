import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        const toastId = toast.loading('Creating account...')

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            })

            if (error) {
                console.error('Signup error:', error)
                toast.error(`Signup failed: ${error.message}`, { id: toastId, duration: 5000 })
                setLoading(false)
            } else {
                console.log('Signup successful:', data)
                toast.success('Registration successful! Please login.', { id: toastId })
                navigate('/login')
            }
        } catch (err) {
            console.error('Unexpected signup error:', err)
            toast.error(`Error: ${err.message || 'Unknown error'}`, { id: toastId, duration: 5000 })
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gray-900">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1595841055318-943e157b6059?q=80&w=2070&auto=format&fit=crop"
                    alt="Livestock Background"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Form Container */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Join Us</h1>
                    <p className="text-sm text-gray-200">Create an account to start trading</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
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
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-300">
                    Already have an account? <Link to="/login" className="font-bold text-white hover:text-blue-300 hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    )
}

export default Register
