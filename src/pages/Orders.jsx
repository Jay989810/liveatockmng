import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthProvider'
import Spinner from '../components/Spinner'
import { Link, useLocation } from 'react-router-dom'

const Orders = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const newOrder = location.state?.newOrder ? location.state : null;

    useEffect(() => {
        if (user) {
            fetchOrders()
        } else {
            setLoading(false)
        }
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

                {/* Guest Order Confirmation View */}
                {newOrder && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="bg-green-100 p-2 rounded-full mr-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-green-800">Order Placed Successfully!</h2>
                                <p className="text-green-700 text-sm">Thank you for your purchase. Your order reference is <span className="font-mono font-bold">{newOrder.tx_ref}</span></p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-green-100">
                            <h3 className="font-bold text-gray-800 mb-2">Order Summary</h3>
                            <p className="text-sm text-gray-600 mb-1">Total Paid: <span className="font-bold text-gray-900">₦{newOrder.total?.toLocaleString()}</span></p>
                            <p className="text-sm text-gray-600">Delivering to: <span className="font-medium">{newOrder.details?.recipient_name}</span> at {newOrder.details?.city}</p>
                        </div>
                        <p className="mt-4 text-xs text-green-700 italic">Please save this page or screenshot it for your records, as you are checking out as a guest.</p>
                    </div>
                )}

                {!user && !newOrder ? (
                    <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Guest Access</h3>
                        <p className="text-gray-500 mb-6">Please sign in to view your full order history.</p>
                        <div className="flex justify-center space-x-4">
                            <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Sign In</Link>
                            <Link to="/register" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Register</Link>
                        </div>
                    </div>
                ) : orders.length === 0 && !newOrder ? (
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
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            <p><span className="font-semibold">Delivering to:</span> {order.recipient_name || 'You'}</p>
                                                            <p className="truncate max-w-xs">
                                                                {order.delivery_address}
                                                                {order.city ? `, ${order.city}` : ''}
                                                                {order.state ? `, ${order.state}` : ''}
                                                            </p>
                                                            {order.delivery_instructions && (
                                                                <p className="italic text-gray-400 mt-0.5">Note: {order.delivery_instructions}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex flex-col items-end mb-2">
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Successful' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col items-end mb-2">
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Delivery</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${(order.delivery_status || 'Processing') === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            (order.delivery_status || 'Processing') === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-gray-50 text-gray-600 border-gray-200'
                                                            }`}>
                                                            {order.delivery_status || 'Processing'}
                                                        </span>
                                                    </div>

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
