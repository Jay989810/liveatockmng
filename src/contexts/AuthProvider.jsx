import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        let mounted = true;

        // Function to handle session setup
        const initializeAuth = async () => {
            try {
                // 1. Get the current session from local storage
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) throw error

                if (mounted) {
                    if (session?.user) {
                        setSession(session)
                        setUser(session.user)
                        await checkAdmin(session.user.id)
                    } else {
                        // Definitely logged out
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                if (mounted) setLoading(false)
            }
        }

        initializeAuth()

        // 2. Set up live listener for auth changes (sign in, sign out, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                // If we get a user update and we aren't loading, or if we switched users
                // we might want to refresh admin status.
                // But mainly we care about the initial load or sign-in.
                if (!isAdmin) await checkAdmin(session.user.id)
            } else {
                setIsAdmin(false)
                setLoading(false)
            }
        })

        return () => {
            mounted = false;
            subscription.unsubscribe()
        }
    }, [])

    const checkAdmin = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', userId)
                .single()

            // If error (e.g. no profile found), just treat as non-admin
            if (data) {
                setIsAdmin(data.is_admin)
            } else {
                setIsAdmin(false)
            }
        } catch (error) {
            console.error('Error checking admin status:', error)
            setIsAdmin(false)
        } finally {
            setLoading(false)
        }
    }

    const customSignOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            // Force clear state
            setUser(null)
            setSession(null)
            setIsAdmin(false)
            // Clear all local storage to be safe as requested
            localStorage.clear()
            sessionStorage.clear()
        }
    }

    const value = {
        session,
        user,
        isAdmin,
        signOut: customSignOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}
