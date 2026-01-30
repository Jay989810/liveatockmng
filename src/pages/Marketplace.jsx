import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

const Marketplace = () => {
    const [livestock, setLivestock] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAvailableLivestock()
    }, [])

    const fetchAvailableLivestock = async () => {
        // Safety timeout
        const timer = setTimeout(() => {
            if (loading) setLoading(false);
        }, 8000);

        try {
            const { data, error } = await supabase
                .from('livestock')
                .select('*')
                .eq('status', 'Available')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLivestock(data)
        } catch (error) {
            console.error('Error fetching livestock:', error.message)
            toast.error('Could not load livestock. Please check your connection.')
        } finally {
            clearTimeout(timer)
            setLoading(false)
        }
    }

    // Determine the image to show for a store item
    const getThumbnail = (item) => {
        if (item.images && item.images.length > 0) return item.images[0];
        if (item.image_url) return item.image_url;
        return null;
    }

    return (
        <div className="flex-grow bg-gray-50 flex flex-col">
            {/* Hero Section */}
            <div className="relative bg-gray-900 text-white h-[600px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop"
                        alt="Background Livestock Herd"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-gray-900/90"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-200 text-sm font-semibold mb-6 backdrop-blur-sm">
                        #1 Livestock Management Platform
                    </span>
                    <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-2xl text-white">
                        Premium Livestock <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Marketplace</span>
                    </h2>
                    <p className="text-gray-100 text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed drop-shadow-lg mb-10">
                        Connect directly with verified breeders. Secure transactions, quality assured animals, and seamless logistics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#browse" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1 text-lg">
                            Browse Inventory
                        </a>
                        <Link to="/register" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all transform hover:-translate-y-1 text-lg">
                            Sell Livestock
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div id="browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow w-full">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-800">Latest Arrivals</h3>
                    <span className="text-sm text-gray-500">{livestock.length} Available</span>
                </div>

                {loading ? (
                    <Spinner />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {livestock.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-3xl shadow-sm border border-gray-100">
                                <p className="text-xl font-medium text-gray-900">No livestock currently available</p>
                                <p className="text-gray-400 mt-2">Check back later for new stock.</p>
                            </div>
                        ) : (
                            livestock.map((item) => {
                                const thumb = getThumbnail(item);
                                return (
                                    <Link key={item.id} to={`/product/${item.id}`} className="group flex flex-col h-full">
                                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                                            <div className="aspect-w-4 aspect-h-3 w-full bg-gray-100 relative overflow-hidden h-64">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={item.breed}
                                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-300 bg-gray-50">
                                                        <span className="text-sm">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 shadow-lg backdrop-blur-md bg-white/70 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-white/50">
                                                    AVAILABLE
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.breed}</h3>
                                                </div>
                                                <p className="text-2xl font-extrabold text-blue-600 mb-4">₦{parseFloat(item.price).toLocaleString()}</p>

                                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs uppercase font-semibold text-gray-400">Age</span>
                                                        <span className="font-medium text-gray-900">{item.age} months</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs uppercase font-semibold text-gray-400">Weight</span>
                                                        <span className="font-medium text-gray-900">{item.weight} kg</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-blue-600 font-semibold group-hover:text-blue-700">
                                                    <span className="text-sm">View Details</span>
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Marketplace
