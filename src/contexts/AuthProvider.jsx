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

        // Safety timeout: if Supabase takes too long, stop loading
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check timed out, forcing loading false');
                setLoading(false);
            }
        }, 3000); // Reduced to 3 seconds for faster response

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                checkAdmin(session.user.id)
            } else {
                setLoading(false)
            }
        }).catch(err => {
            console.error('Session check failed:', err)
            if (mounted) setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setSession(session)
            setUser(session?.user ?? null)

            // Only set loading true if we are logging in (session exists)
            // If we are logging out (session null), we want to clear fast
            if (session?.user) {
                setLoading(true)
                await checkAdmin(session.user.id)
            } else {
                setIsAdmin(false)
                setLoading(false)
            }
        })

        return () => {
            mounted = false;
            clearTimeout(timer);
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
