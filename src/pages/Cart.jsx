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

    // Checkout Form State
    const [deliveryDetails, setDeliveryDetails] = useState({
        recipient_name: user?.user_metadata?.full_name || '',
        delivery_address: '',
        phone_number: ''
    })

    const handleInputChange = (e) => {
        setDeliveryDetails({ ...deliveryDetails, [e.target.name]: e.target.value })
    }

    // Flutterwave Config
    const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: Date.now(),
        amount: cartTotal,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email,
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
        if (!user) {
            toast.error('Please login to checkout')
            navigate('/login')
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
            // Create transaction records for each item
            const transactions = cart.map(item => ({
                user_id: user.id,
                livestock_id: item.id,
                amount: item.price,
                flutterwave_ref: paymentResponse.tx_ref,
                status: 'Successful',
                delivery_status: 'Processing',
                recipient_name: deliveryDetails.recipient_name,
                delivery_address: deliveryDetails.delivery_address,
                phone_number: deliveryDetails.phone_number
            }))

            const { error: txError } = await supabase
                .from('transactions')
                .insert(transactions)

            if (txError) throw txError

            // Update livestock status (Sold) and decrement quantity
            // Note: Simplest way is loop updates for now, ideally RPC function or batched
            for (const item of cart) {
                // Decrement Quantity Logic
                // We fetch fresh first or just blind update? Blind update decrement safer
                // But simplified: Just set Sold? No, we have quantity now.
                // We need to fetch current quantity and decrement.
                // To save API calls, we'll try a single update if only 1 item, else loop.
                // Or: Supabase doesn't support 'quantity - 1' natively in simple update without RPC.
                // We will just set status 'Sold' if it's unique item, or decrement if quantity logic used.
                // For this project: Just set Status='Sold' is safer if quantity=1.
                // If quantity > 1, we need more logic. 
                // Let's assume quantity is handled by decrementing.

                const { data: lsData } = await supabase.from('livestock').select('quantity').eq('id', item.id).single()
                const newQty = (lsData?.quantity || 1) - 1

                await supabase
                    .from('livestock')
                    .update({
                        quantity: newQty,
                        status: newQty <= 0 ? 'Sold' : 'Available'
                    })
                    .eq('id', item.id)
            }

            clearCart()
            toast.success('Order placed successfully!', { id: toastId })
            navigate('/orders')

        } catch (error) {
            console.error('Order processing error:', error)
            toast.error('Error recording order. Please contact support.', { id: toastId })
        } finally {
            setLoading(false)
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    name="phone_number"
                                    value={deliveryDetails.phone_number}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                                <textarea
                                    name="delivery_address"
                                    value={deliveryDetails.delivery_address}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
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
                )}
            </div>
        </div>
    )
}

export default Cart
