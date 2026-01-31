import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthProvider'
import Spinner from '../components/Spinner'
import { Link } from 'react-router-dom'

const Orders = () => {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchOrders()
    }, [user])

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*, livestock(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by browsing our marketplace.</p>
                        <div className="mt-6">
                            <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                Browse Marketplace
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {orders.map((order) => {
                                // Handle image logic safe check
                                const livestock = order.livestock;
                                let thumb = null;
                                if (livestock) {
                                    if (livestock.images && livestock.images.length > 0) thumb = livestock.images[0];
                                    else if (livestock.image_url) thumb = livestock.image_url;
                                }

                                return (
                                    <li key={order.id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                        {thumb ? (
                                                            <img className="h-full w-full object-cover" src={thumb} alt="" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-blue-600 truncate">{livestock?.breed || 'Unknown Item'}</p>
                                                        <p className="flex items-center text-sm text-gray-500">
                                                            Tag: {livestock?.tag_number || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Order ID: {order.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {order.status}
                                                    </p>
                                                    <p className="mt-2 text-sm text-gray-900 font-bold">
                                                        ₦{parseFloat(order.amount).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Orders
