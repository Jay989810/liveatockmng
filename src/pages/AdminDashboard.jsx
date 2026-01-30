import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
    const [livestock, setLivestock] = useState([])
    const [stats, setStats] = useState({ total: 0, sold: 0, revenue: 0 })
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [editingId, setEditingId] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        tag_number: '',
        breed: '',
        age: '',
        weight: '',
        price: '',
        status: 'Available',
        health_notes: '',
        images: [], // File objects for upload
        image_display_urls: [] // URLs for display (existing)
    })

    useEffect(() => {
        fetchLivestock()
    }, [])

    useEffect(() => {
        if (livestock.length > 0) calculateStats()
    }, [livestock])

    const fetchLivestock = async () => {
        try {
            const { data, error } = await supabase
                .from('livestock')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLivestock(data)
        } catch (error) {
            console.error('Error fetching livestock:', error.message)
            toast.error('Failed to load livestock')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = () => {
        const total = livestock.length
        const sold = livestock.filter(item => item.status === 'Sold').length
        const revenue = livestock
            .filter(item => item.status === 'Sold')
            .reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0)

        setStats({ total, sold, revenue })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageChange = (e) => {
        if (e.target.files) {
            setFormData(prev => ({ ...prev, images: Array.from(e.target.files) }))
        }
    }

    const handleImageUpload = async (files) => {
        const urls = []

        for (const file of files) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('livestock-images')
                .upload(filePath, file)

            if (uploadError) {
                toast.error(`Failed to upload ${file.name}`)
                continue;
            }

            const { data } = supabase.storage
                .from('livestock-images')
                .getPublicUrl(filePath)

            urls.push(data.publicUrl)
        }
        return urls
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUploading(true)
        const toastId = toast.loading('Saving livestock...')

        try {
            let finalImageUrls = formData.image_display_urls // Keep existing URLs if any in edit mode

            // Upload new images if selected
            if (formData.images && formData.images.length > 0) {
                const newUrls = await handleImageUpload(formData.images)
                // If editing, decide whether to append or replace. Let's replace for simplicity or append?
                // Let's replace newly uploaded ones if it's a new batch, or append.
                // For this UI, let's assume we replace or add to empty.
                // Actually, logic: if files selected, use those. If editing and no files, keep old.
                // But what if they want to add? Let's just append new ones to existing list for now
                finalImageUrls = [...finalImageUrls, ...newUrls]
            }

            // Fallback for backward compatibility helper (if you still have image_url column logic, but we assume we use images array primarily now)
            const primaryImage = finalImageUrls.length > 0 ? finalImageUrls[0] : null;

            const livestockData = {
                tag_number: formData.tag_number,
                breed: formData.breed,
                age: formData.age,
                weight: formData.weight,
                price: formData.price,
                status: formData.status,
                health_notes: formData.health_notes,
                images: finalImageUrls, // New Array Column
                image_url: primaryImage // Keep this for backward compat if table still has it
            }

            if (editingId) {
                const { error } = await supabase
                    .from('livestock')
                    .update(livestockData)
                    .eq('id', editingId)

                if (error) throw error
                toast.success('Livestock updated successfully!', { id: toastId })
            } else {
                const { error } = await supabase
                    .from('livestock')
                    .insert([livestockData])

                if (error) throw error
                toast.success('Livestock added successfully!', { id: toastId })
            }

            // Reset form
            setFormData({
                tag_number: '',
                breed: '',
                age: '',
                weight: '',
                price: '',
                status: 'Available',
                health_notes: '',
                images: [],
                image_display_urls: []
            })
            setEditingId(null)
            fetchLivestock()

        } catch (error) {
            console.error('Error saving livestock:', error.message)
            toast.error('Error: ' + error.message, { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleEdit = (item) => {
        setEditingId(item.id)
        // Handle both old single image_url and new images array
        let currentImages = item.images || []
        if (currentImages.length === 0 && item.image_url) {
            currentImages = [item.image_url]
        }

        setFormData({
            tag_number: item.tag_number,
            breed: item.breed,
            age: item.age,
            weight: item.weight,
            price: item.price,
            status: item.status,
            health_notes: item.health_notes || '',
            images: [],
            image_display_urls: currentImages
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            image_display_urls: prev.image_display_urls.filter((_, idx) => idx !== indexToRemove)
        }))
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this livestock?')) return

        const toastId = toast.loading('Deleting...')
        try {
            const { error } = await supabase
                .from('livestock')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Deleted successfully', { id: toastId })
            fetchLivestock()
        } catch (error) {
            console.error('Error deleting livestock:', error.message)
            toast.error('Error deleting livestock', { id: toastId })
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="flex-grow bg-gray-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Livestock</h3>
                        <p className="text-4xl font-bold text-gray-800 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Sold</h3>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{stats.sold}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Revenue</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">₦{stats.revenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Add/Edit Livestock Form */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-10">
                    <div className="bg-gray-900 px-6 py-4 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">
                            {editingId ? 'Edit Livestock' : 'Add New Livestock'}
                        </h2>
                    </div>
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Tag Number</label>
                                <input
                                    name="tag_number"
                                    placeholder="e.g., C001"
                                    value={formData.tag_number}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Breed</label>
                                <input
                                    name="breed"
                                    placeholder="e.g., Holstein"
                                    value={formData.breed}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Age (Months)</label>
                                <input
                                    name="age"
                                    type="number"
                                    placeholder="e.g., 24"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                                <input
                                    name="weight"
                                    type="number"
                                    placeholder="e.g., 500"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Price (₦)</label>
                                <input
                                    name="price"
                                    type="number"
                                    placeholder="e.g., 150000"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Sold">Sold</option>
                                    <option value="Reserved">Reserved</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-medium text-gray-700">Health Notes</label>
                                <textarea
                                    name="health_notes"
                                    placeholder="Any vaccinations or health issues..."
                                    value={formData.health_notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="text-sm font-medium text-gray-700">Images (Select text)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />

                                {/* Image Previews */}
                                {(formData.image_display_urls.length > 0 || (formData.images && formData.images.length > 0)) && (
                                    <div className="grid grid-cols-4 gap-4 mt-4">
                                        {formData.image_display_urls.map((url, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={url} alt={`preview ${idx}`} className="h-24 w-full object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md flex justify-center items-center"
                                >
                                    {uploading ? 'Processing Uploads...' : editingId ? 'Update Livestock' : 'Add Livestock'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({
                                                tag_number: '', breed: '', age: '', weight: '', price: '', status: 'Available', health_notes: '', images: [], image_display_urls: []
                                            });
                                        }}
                                        className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                        </form>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Livestock Inventory</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{livestock.length} Items</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Image</th>
                                    <th scope="col" className="px-6 py-4">Tag #</th>
                                    <th scope="col" className="px-6 py-4">Price</th>
                                    <th scope="col" className="px-6 py-4">Status</th>
                                    <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {livestock.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No livestock found.</td>
                                    </tr>
                                ) : (
                                    livestock.map((item) => {
                                        // Determine image to show
                                        let thumb = null;
                                        if (item.images && item.images.length > 0) thumb = item.images[0];
                                        else if (item.image_url) thumb = item.image_url;

                                        return (
                                            <tr key={item.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    {thumb && <img src={thumb} alt="img" className="w-12 h-12 rounded object-cover border border-gray-200" />}
                                                    {item.images && item.images.length > 1 && (
                                                        <span className="text-xs text-gray-400 block mt-1">+{item.images.length - 1} more</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.tag_number}</td>
                                                <td className="px-6 py-4 text-gray-900 font-semibold">₦{parseFloat(item.price).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                            item.status === 'Sold' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex justify-center space-x-2">
                                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
