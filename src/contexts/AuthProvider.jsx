import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(() => {
        // Initialize from local storage to prevent flicker
        return localStorage.getItem('livestock_is_admin') === 'true'
    })

    // UNIQUE VERSION IDENTIFIER - UPDATE THIS ON EVERY MAJOR DEPLOYMENT
    const APP_VERSION = 'deploy-2026-01-31-v2-persistent'

    useEffect(() => {
        // Version Check & Cache Clear strategy
        const storedVersion = localStorage.getItem('app_version')
        if (storedVersion !== APP_VERSION) {
            console.log(`New version detected (${APP_VERSION}). Clearing stale data.`)

            // Clear ONLY app-specific data, preserving keys if needed or just clear all
            // Ideally we clear everything to be safe on a major version change
            localStorage.clear()
            sessionStorage.clear()

            localStorage.setItem('app_version', APP_VERSION)

            // We do NOT reload here if it's a fresh visit to avoid loops.
            // But if the user was using an old version, their state might be weird.
            // Since we cleared local storage, Supabase token is gone, so they are logged out effectively.
            return
        }

        let mounted = true;

        // EMERGENCY TIMEOUT: Force app to load after 5 seconds
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check timed out, forcing application load');
                setLoading(false);
            }
        }, 5000);

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
                        // Don't await checkAdmin to block UI locally if possible, but for admin portal it helps
                        checkAdmin(session.user.id)
                    } else {
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                if (mounted) setLoading(false)
            }
        }

        initializeAuth()

        // 2. Set up live listener for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            console.log('Auth State Change:', event); // Debug log

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                // Optimization: Only check admin if we don't have it trusted yet
                if (!isAdmin) await checkAdmin(session.user.id)
            } else {
                setIsAdmin(false)
                localStorage.removeItem('livestock_is_admin')
                setLoading(false)
            }
        })

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
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

            if (data) {
                const isAdminValue = data.is_admin || false
                setIsAdmin(isAdminValue)
                if (isAdminValue) localStorage.setItem('livestock_is_admin', 'true')
                else localStorage.removeItem('livestock_is_admin')
            } else {
                setIsAdmin(false)
                localStorage.removeItem('livestock_is_admin')
            }
        } catch (error) {
            console.error('Error checking admin status:', error)
            // Do NOT wipe admin status on error if we had it cached? 
            // Safer to deny access on error for security.
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
            // Force clear critical state
            setUser(null)
            setSession(null)
            setIsAdmin(false)

            // Clear specific keys instead of clear() to avoid 'app_version' loop issues if we restart
            localStorage.removeItem('livestock_is_admin')
            localStorage.removeItem('livestock_cart')
            // Don't remove 'app_version'

            // Force redirect to login which is cleaner
            window.location.href = '/login'
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
