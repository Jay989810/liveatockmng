import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import { useAuth } from '../contexts/AuthProvider'
import { useCart } from '../contexts/CartContext'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

const ProductDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [livestock, setLivestock] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)
    const [imageList, setImageList] = useState([])

    useEffect(() => {
        fetchLivestockDetails()
    }, [id])

    const fetchLivestockDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('livestock')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setLivestock(data)

            // Prepare image list
            let images = []
            if (data.images && data.images.length > 0) {
                images = data.images
            } else if (data.image_url) {
                images = [data.image_url]
            }
            setImageList(images)
            setSelectedImage(images[0] || null)

        } catch (error) {
            console.error('Error fetching livestock details:', error.message)
            toast.error('Livestock not found')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        if (!user) {
            toast.error('Please login to add to cart.')
            return
        }
        addToCart(livestock)
    }

    const handleBuyNow = () => {
        if (!user) {
            toast.error('Please login to purchase.')
            return
        }
        addToCart(livestock)
        navigate('/cart')
    }

    if (loading) return <Spinner />

    if (!livestock) return <div className="text-center p-10">Livestock not found.</div>

    // Availability Check: Status is Available AND Quantity > 0
    const isAvailable = livestock.status === 'Available' && (livestock.quantity === undefined || livestock.quantity > 0);

    return (
        <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex-grow">
            <div className="max-w-6xl mx-auto">

                <button onClick={() => navigate('/')} className="mb-8 flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Marketplace
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden lg:flex border border-gray-100 min-h-[500px]">
                    {/* Image Gallery Section */}
                    <div className="lg:w-1/2 bg-gray-100 flex flex-col">
                        <div className="flex-grow relative h-96 lg:h-auto bg-gray-200">
                            {selectedImage ? (
                                <img src={selectedImage} alt={livestock.breed} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                            )}
                            <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm z-10 ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {isAvailable ? 'AVAILABLE' : 'SOLD OUT'}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {imageList.length > 1 && (
                            <div className="bg-white p-4 flex space-x-2 overflow-x-auto border-t border-gray-100">
                                {imageList.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === img ? 'border-blue-500' : 'border-transparent'}`}
                                    >
                                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">

                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-blue-600 tracking-wide uppercase mb-2">Livestock Details</h2>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{livestock.breed}</h1>
                            <p className="text-gray-500 font-mono text-sm">Tag: {livestock.tag_number}</p>
                        </div>

                        <div className="bg-blue-50/50 p-6 rounded-2xl mb-8 border border-blue-50">
                            <h3 className="text-sm font-semibold text-blue-800 uppercase mb-2">Health & Notes</h3>
                            <p className="text-gray-700 leading-relaxed">
                                {livestock.health_notes || 'Animal is in good condition.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Age</p>
                                <p className="text-xl font-bold text-gray-900">{livestock.age} Months</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Weight</p>
                                <p className="text-xl font-bold text-gray-900">{livestock.weight} kg</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl col-span-2">
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Stock Available</p>
                                <p className="text-xl font-bold text-gray-900">{livestock.quantity || 1} Remaining</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-auto space-x-4">
                            <div>
                                <p className="text-gray-400 text-sm font-medium mb-1">Price</p>
                                <p className="text-3xl font-extrabold text-blue-600 tracking-tight">₦{parseFloat(livestock.price).toLocaleString()}</p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!isAvailable}
                                    className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md transition-all transform hover:-translate-y-1 ${isAvailable
                                        ? 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent'
                                        }`}
                                >
                                    Add to Cart
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={!isAvailable}
                                    className={`px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${isAvailable
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
