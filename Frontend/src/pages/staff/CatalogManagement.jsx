import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Image as ImageIcon, Coins, Search, Tag, Check, AlertCircle, X, Upload, Loader2 } from 'lucide-react';
import Card from '../../components/Card';
import AnimatedButton from '../../components/AnimatedButton';

const CATEGORY_OPTIONS = ['Vehicles', 'VIP Perks', 'Currency', 'Businesses', 'Weapons & Gear', 'Custom Perks', 'General'];

const getAuthToken = () => localStorage.getItem('authToken') || localStorage.getItem('token') || '';

const CatalogManagement = ({ user }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [message, setMessage] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_coins: 500,
        image_url: '',
        category: 'Vehicles'
    });

    // Image upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingStatus, setUploadingStatus] = useState('');

    // Delete confirmation state
    const [deletingId, setDeletingId] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://lsreborn-backend.onrender.com';

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/catalog?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Error fetching catalog:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price_coins: 500,
            image_url: '',
            category: 'Vehicles'
        });
        setSelectedFile(null);
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            description: item.description || '',
            price_coins: item.price_coins || 0,
            image_url: item.image_url || '',
            category: item.category || 'General'
        });
        setSelectedFile(null);
        setImagePreview(item.image_url || '');
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be under 8MB.' });
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Item Name is required!' });
            return;
        }

        if (!selectedFile && !formData.image_url.trim() && !imagePreview) {
            setMessage({ type: 'error', text: 'Please select an image file or paste an image URL!' });
            return;
        }

        setSubmitting(true);
        setMessage(null);
        let finalImageUrl = formData.image_url;

        try {
            const token = getAuthToken();
            // Step 1: If a local file was selected, upload directly to Cloudinary via backend API
            if (selectedFile && imagePreview) {
                setUploadingStatus('Uploading image to Cloudinary...');
                const uploadRes = await fetch(`${apiUrl}/api/catalog/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ image: imagePreview })
                });

                const uploadData = await uploadRes.json();
                if (uploadRes.ok && uploadData.url) {
                    finalImageUrl = uploadData.url;
                } else {
                    throw new Error(uploadData.message || 'Cloudinary upload failed.');
                }
            }

            // Step 2: Save Item to Catalogue Database
            setUploadingStatus('Saving item to Catalogue...');
            const url = editingItem 
                ? `${apiUrl}/api/catalog/${editingItem.id}`
                : `${apiUrl}/api/catalog`;
            const method = editingItem ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                image_url: finalImageUrl
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: editingItem ? 'Item updated successfully!' : 'New item added to Catalogue and saved to Cloudinary!' });
                setIsModalOpen(false);
                fetchCatalog();
            } else {
                setMessage({ type: 'error', text: data.message || 'Action failed.' });
            }
        } catch (err) {
            console.error("Error saving item:", err);
            setMessage({ type: 'error', text: err.message || 'Server error saving catalogue item.' });
        } finally {
            setSubmitting(false);
            setUploadingStatus('');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = getAuthToken();
            const res = await fetch(`${apiUrl}/api/catalog/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Item deleted from Catalogue!' });
                setItems(prev => prev.filter(i => i.id !== id));
                setDeletingId(null);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.message || 'Failed to delete item.' });
            }
        } catch (err) {
            console.error("Delete Error:", err);
            setMessage({ type: 'error', text: 'Server error deleting item.' });
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-cyan-500/20 backdrop-blur-xl">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <ShoppingBag className="text-cyan-400" size={26} />
                        Catalogue & Shop Management
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Add, edit, or remove items displayed in the public Kaizen City Catalogue.
                    </p>
                </div>
                <AnimatedButton 
                    onClick={openAddModal} 
                    className="bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                    <Plus size={18} />
                    Add Catalogue Item
                </AnimatedButton>
            </div>

            {/* Notification Banner */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Search & Category Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search items by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>
                <div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORY_OPTIONS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm">Loading Catalogue Items...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800 space-y-4">
                    <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-300">No Items Found</h3>
                        <p className="text-sm text-gray-500 mt-1">Click "Add Catalogue Item" above to add your first item!</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl group">
                            <div>
                                {/* Image Box - Dual Layer Uncropped Display */}
                                <div className="relative h-48 w-full overflow-hidden bg-gray-950 flex items-center justify-center p-2 border-b border-gray-800/80 group">
                                    <img 
                                        src={item.image_url} 
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 transition-transform duration-700 group-hover:scale-150 pointer-events-none"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <img 
                                        src={item.image_url} 
                                        alt={item.name}
                                        className="relative z-10 max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                                    />
                                    <div className="absolute top-2.5 left-2.5 z-20 bg-gray-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-lg">
                                        <Tag size={12} />
                                        {item.category || 'General'}
                                    </div>
                                    <div className="absolute top-2.5 right-2.5 z-20 bg-cyan-950/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-lg">
                                        <Coins size={14} className="text-amber-400" />
                                        {Number(item.price_coins).toLocaleString()} LSR Coins
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                                        {item.name}
                                    </h3>
                                    {item.description ? (
                                        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                            {item.description}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-600 italic">No description provided.</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-gray-800/60 mt-3 pt-3">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gray-700"
                                >
                                    <Edit3 size={14} />
                                    Edit Item
                                </button>
                                <button
                                    onClick={() => setDeletingId(item.id)}
                                    className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-800/50"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="text-cyan-400" size={22} />
                                {editingItem ? 'Edit Catalogue Item' : 'Add New Item to Catalogue'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    Item Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Pegassi Zorrusso (Custom Car)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Price (LSR Coins) <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            placeholder="500"
                                            value={formData.price_coins}
                                            onChange={(e) => setFormData({ ...formData, price_coins: e.target.value })}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60 cursor-pointer"
                                    >
                                        {CATEGORY_OPTIONS.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Direct Photo Upload / URL Option */}
                            <div className="space-y-3 p-4 bg-gray-950 rounded-xl border border-gray-800">
                                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                    Item Photo Upload <span className="text-rose-400">*</span>
                                </label>
                                
                                {/* Upload Button */}
                                <div>
                                    <label className="flex items-center justify-center gap-2 p-3 bg-gray-900 hover:bg-gray-800 border border-dashed border-cyan-500/40 rounded-xl cursor-pointer text-xs font-semibold text-gray-300 hover:text-white transition-colors">
                                        <Upload size={16} className="text-cyan-400" />
                                        <span>Choose Photo File from Computer</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-[11px] text-gray-500 mt-1 text-center">
                                        Selecting a file will automatically upload it to Cloudinary.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 my-2">
                                    <div className="flex-1 h-px bg-gray-800" />
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">OR PASTE URL</span>
                                    <div className="flex-1 h-px bg-gray-800" />
                                </div>

                                {/* URL Input */}
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="url"
                                        placeholder="https://res.cloudinary.com/.../image.png"
                                        value={formData.image_url}
                                        onChange={(e) => {
                                            setFormData({ ...formData, image_url: e.target.value });
                                            if (!selectedFile) setImagePreview(e.target.value);
                                        }}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                                    />
                                </div>
                            </div>

                            {/* Live Image Preview */}
                            {(imagePreview || formData.image_url) && (
                                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
                                    <span className="text-xs font-semibold text-gray-400 block">Photo Preview:</span>
                                    <div className="h-36 w-full rounded-lg overflow-hidden bg-gray-900 border border-cyan-500/20">
                                        <img 
                                            src={imagePreview || formData.image_url} 
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://res.cloudinary.com/n8ql5bui/image/upload/v1785606470/KAIZEN_CITY_LOGO_lk0ycw.png'; }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                    Item Description (Optional)
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe features, stats, speed, or perk details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60"
                                />
                            </div>

                            {uploadingStatus && (
                                <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center gap-2 text-cyan-300 text-xs font-semibold animate-pulse">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{uploadingStatus}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <AnimatedButton
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 text-sm font-semibold shadow-lg shadow-cyan-500/20"
                                >
                                    {submitting ? 'Uploading & Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                                </AnimatedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-gray-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <AlertCircle size={28} />
                            <h3 className="text-lg font-bold text-white">Confirm Item Deletion</h3>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Are you sure you want to remove this item from the Catalogue? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/20"
                            >
                                Yes, Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogManagement;
