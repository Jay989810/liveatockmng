import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthProvider'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const Cart = () => {
    const { cart, removeFromCart, cartTotal, clearCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const mounted = true // Just use a simple variable for now, or remove the check since finally block is safe enough typically.
    // Actually, let's just remove 'if (mounted)' from the previous step if I can't easily add the hook logic without re-rendering everything.
    // Wait, I can just not use 'mounted' variable and trust React.


    // Checkout Form State
    const [deliveryDetails, setDeliveryDetails] = useState(() => {
        try {
            const saved = localStorage.getItem('deliveryDetails')
            return saved ? JSON.parse(saved) : {
                recipient_name: user?.user_metadata?.full_name || '',
                phone_number: '',
                state: '',
                city: '',
                delivery_address: '',
                delivery_instructions: ''
            }
        } catch (e) {
            return {
                recipient_name: user?.user_metadata?.full_name || '',
                email: user?.email || '',
                phone_number: '',
                state: '',
                city: '',
                delivery_address: '',
                delivery_instructions: ''
            }
        }
    })

    // Update state and persist to storage
    const handleInputChange = (e) => {
        const newDetails = { ...deliveryDetails, [e.target.name]: e.target.value }
        setDeliveryDetails(newDetails)
        localStorage.setItem('deliveryDetails', JSON.stringify(newDetails))
    }

    // Flutterwave Config
    const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: Date.now(),
        amount: cartTotal,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || deliveryDetails.email,
            phone_number: deliveryDetails.phone_number,
            name: deliveryDetails.recipient_name,
        },
        customizations: {
            title: 'Livestock Checkout',
            description: `Payment for ${cart.length} items`,
            logo: 'https://cdn-icons-png.flaticon.com/512/2395/2395796.png',
        },
    }

    const handleFlutterwavePayment = useFlutterwave(config)

    const handleCheckout = (e) => {
        e.preventDefault()
        // Removed auth check to allow guest checkout
        if (cart.length === 0) {
            toast.error('Cart is empty')
            return
        }

        // Validate email for guests
        if (!user && !deliveryDetails.email) {
            toast.error('Please provide an email address')
            return
        }
        if (cart.length === 0) {
            toast.error('Cart is empty')
            return
        }

        handleFlutterwavePayment({
            callback: (response) => {
                const status = response.status ? response.status.toLowerCase() : ''
                if (status === 'successful' || status === 'completed') {
                    processOrder(response)
                } else {
                    toast.error('Payment failed')
                    closePaymentModal()
                }
            },
            onClose: () => { },
        })
    }

    const processOrder = async (paymentResponse) => {
        setLoading(true)
        const toastId = toast.loading('Processing order...')

        try {
            // Prepare items for RPC
            const orderItems = cart.map(item => ({
                id: item.id,
                price: item.price
            }))

            // Ensure no undefined values are passed to RPC
            const safeDetails = {
                recipient_name: deliveryDetails.recipient_name || '',
                phone_number: deliveryDetails.phone_number || '',
                state: deliveryDetails.state || '',
                city: deliveryDetails.city || '',
                delivery_address: deliveryDetails.delivery_address || '',
                delivery_instructions: deliveryDetails.delivery_instructions || ''
            }

            // Call the secure RPC function
            const { error: rpcError } = await supabase.rpc('complete_order', {
                p_user_id: user ? user.id : null,
                p_items: orderItems,
                p_payment_ref: paymentResponse.tx_ref,
                p_recipient_name: safeDetails.recipient_name,
                p_phone_number: safeDetails.phone_number,
                p_state: safeDetails.state,
                p_city: safeDetails.city,
                p_delivery_address: safeDetails.delivery_address,
                p_delivery_instructions: safeDetails.delivery_instructions
            })

            if (rpcError) throw rpcError

            clearCart()
            toast.success('Order placed successfully!', { id: toastId })

            // Navigate to orders with state to show the success message/details even for guests
            navigate('/orders', {
                state: {
                    newOrder: true,
                    items: cart,
                    details: safeDetails,
                    total: cartTotal,
                    tx_ref: paymentResponse.tx_ref
                }
            })
        } finally {
            if (mounted) setLoading(false)
            closePaymentModal()
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow text-center">
                            <p className="text-gray-500">Your cart is empty.</p>
                            <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">Browse Marketplace</button>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.breed} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs">No Img</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{item.breed}</h3>
                                        <p className="text-sm text-gray-500">Tag: {item.tag_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold">₦{parseFloat(item.price).toLocaleString()}</span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Form */}
                {cart.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow h-fit">
                        <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
                        <form onSubmit={handleCheckout} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                                <input
                                    name="recipient_name"
                                    value={deliveryDetails.recipient_name}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {!user && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={deliveryDetails.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="your@email.com"
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        name="phone_number"
                                        value={deliveryDetails.phone_number}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="080..."
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State/Region</label>
                                    <input
                                        name="state"
                                        value={deliveryDetails.state}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Lagos"
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City/Town</label>
                                    <input
                                        name="city"
                                        value={deliveryDetails.city}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Ikeja"
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                <textarea
                                    name="delivery_address"
                                    value={deliveryDetails.delivery_address}
                                    onChange={handleInputChange}
                                    required
                                    rows="2"
                                    placeholder="House number, street name..."
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Delivery Instructions (Optional)</label>
                                <textarea
                                    name="delivery_instructions"
                                    value={deliveryDetails.delivery_instructions}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="Nearest landmark, gate code, etc."
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-bold text-lg mb-4">
                                    <span>Total:</span>
                                    <span>₦{cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                                >
                                    Pay Now
                                </button>
                            </div>
                        </form>
                    </div>
                )
                }
            </div >
        </div >
    )
}

export default Cart
