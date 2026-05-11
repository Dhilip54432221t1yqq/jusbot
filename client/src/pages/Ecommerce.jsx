import { useState, useEffect, useRef } from 'react';
import EcommerceSettings from './EcommerceSettings';
import toast from 'react-hot-toast';
import EcommerceTags from './EcommerceTags';
import EcommerceVendors from './EcommerceVendors';
import EcommerceTypes from './EcommerceTypes';
import { 
    Plus, Package, ShoppingCart, DollarSign, Search, 
    MoreHorizontal, Edit3, Trash2, X, ChevronRight, ChevronLeft,
    TrendingUp, PackageCheck, AlertCircle, Clock,
    Eye, Filter, ArrowUpRight, ArrowDownRight, Tag,
    Layers, Ticket, Settings, Box, Store, ClipboardList,
    ImagePlus, Minus, Check, ChevronDown, PlusCircle
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import config from '../config';

const API_BASE = `${config.API_BASE}/ecommerce`;

export default function Ecommerce() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const [uploading, setUploading] = useState(false);
    
    const handleImageUpload = async (file, folder = 'products') => {
        if (!file) return null;
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${workspaceId}/${folder}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Image upload failed');
            return null;
        } finally {
            setUploading(false);
        }
    };
    
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [collectionSearch, setCollectionSearch] = useState('');
    const [pickerSearch, setPickerSearch] = useState('');
    const [orders, setOrders] = useState([]);
    const [collections, setCollections] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [tagsList, setTagsList] = useState([]);
    const [vendorsList, setVendorsList] = useState([]);
    const [typesList, setTypesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [collectionSubTab, setCollectionSubTab] = useState('custom'); // custom | vendors | tags | types
    const [openDropdown, setOpenDropdown] = useState(null); // 'type' | 'vendor' | 'tag' | null

    const getCurrencySymbol = (currencyStr) => {
        if (!currencyStr) return '$';
        if (currencyStr.includes('INR')) return '₹';
        if (currencyStr.includes('USD')) return '$';
        if (currencyStr.includes('EUR')) return '€';
        if (currencyStr.includes('GBP')) return '£';
        if (currencyStr.includes('SGD')) return '$';
        return '$';
    };
    
    // Full-page product form
    const [showProductForm, setShowProductForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(null);
    const imgInputRef = useRef(null);

    // Full-page collection form
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const collectionImgRef = useRef(null);
    
    // Collection Form State
    const [collectionForm, setCollectionForm] = useState({
        title: '',
        description: '',
        image_url: '',
        type: 'manual', // manual | auto
        matchType: 'all', // all | any
        conditions: [{ field: 'Product Name', operator: 'contains', value: '' }]
    });

    // Full-page discount form
    const [showDiscountForm, setShowDiscountForm] = useState(false);
    
    // Discount Form State
    const [discountForm, setDiscountForm] = useState({
        code: '',
        type: 'percentage', // percentage | fixed | shipping
        percentage: 0,
        fixed_amount: 0,
        applies_to: 'entire', // entire | collections | products
        min_req: 'none', // none | amount | qty
        min_amount: '',
        min_qty: '',
        total_limit: false,
        total_limit_val: '',
        per_customer: false,
        startDate: '',
        endDate: '',
        codeError: false
    });
    
    // Form States
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '0.00',
        compare_price: '0.00',
        sku: '',
        barcode: '',
        stock_quantity: 0,
        track_quantity: false,
        has_variants: false,
        category: '',
        vendor: '',
        tags: '',
        note: '',
        status: 'active',
        image_url: '',
        collectionIds: []
    });

    // Variant Options State
    const [variantOptions, setVariantOptions] = useState([
        { name: '', values: [], inputValue: '' }
    ]);

    const addVariantValue = (optIdx) => {
        setVariantOptions(prev => {
            const updated = [...prev];
            const val = updated[optIdx].inputValue.trim();
            if (val && !updated[optIdx].values.includes(val)) {
                updated[optIdx] = { ...updated[optIdx], values: [...updated[optIdx].values, val], inputValue: '' };
            }
            return updated;
        });
    };

    const removeVariantValue = (optIdx, valIdx) => {
        setVariantOptions(prev => {
            const updated = [...prev];
            updated[optIdx] = { ...updated[optIdx], values: updated[optIdx].values.filter((_, i) => i !== valIdx) };
            return updated;
        });
    };

    const updateVariantOptionName = (optIdx, name) => {
        setVariantOptions(prev => {
            const updated = [...prev];
            updated[optIdx] = { ...updated[optIdx], name };
            return updated;
        });
    };

    const updateVariantInputValue = (optIdx, inputValue) => {
        setVariantOptions(prev => {
            const updated = [...prev];
            updated[optIdx] = { ...updated[optIdx], inputValue };
            return updated;
        });
    };

    // Generate variant combos for preview (Recursive to handle any number of options)
    const getVariantCombos = () => {
        const filled = variantOptions.filter(o => o.values.length > 0);
        if (filled.length === 0) return [];
        
        const generate = (index, currentLabel) => {
            if (index === filled.length) {
                return [{ label: currentLabel, price: '0.00', qty: 0, sku: '' }];
            }
            
            let results = [];
            for (const val of filled[index].values) {
                const newLabel = currentLabel ? `${currentLabel} / ${val}` : val;
                results = [...results, ...generate(index + 1, newLabel)];
            }
            return results;
        };

        return generate(0, '');
    };

    const [variantRows, setVariantRows] = useState([]);

    // Automatically sync variant rows whenever options change
    useEffect(() => {
        if (productForm.has_variants) {
            const combos = getVariantCombos();
            setVariantRows(prev => {
                return combos.map(combo => {
                    const existing = prev.find(r => r.label === combo.label);
                    return existing || combo;
                });
            });
        }
    }, [variantOptions, productForm.has_variants]);

    // Aliases for backward compat
    const showAddProductModal = showProductForm && !isEditMode;
    const showEditProductModal = showProductForm && isEditMode;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, orderRes, colRes, discRes, tagsRes, vendRes, typeRes, settRes] = await Promise.all([
                authFetch(`${API_BASE}/products?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/orders?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/collections?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/discounts?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/tags?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/vendors?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/types?workspaceId=${workspaceId}`),
                authFetch(`${API_BASE}/settings?workspaceId=${workspaceId}`)
            ]);
            
            const prodData = await prodRes.json();
            const orderData = await orderRes.json();
            const colData = await colRes.json();
            const discData = await discRes.json();
            const tagsData = await tagsRes.json();
            const vendData = await vendRes.json();
            const typeData = await typeRes.json();
            const settData = await settRes.json();
            
            setProducts(Array.isArray(prodData) ? prodData : []);
            setOrders(Array.isArray(orderData) ? orderData : []);
            setCollections(Array.isArray(colData) ? colData : []);
            setDiscounts(Array.isArray(discData) ? discData : []);
            setTagsList(Array.isArray(tagsData) ? tagsData : []);
            setVendorsList(Array.isArray(vendData) ? vendData : []);
            setTypesList(Array.isArray(typeData) ? typeData : []);
            
            if (settData && settData.currency) {
                setCurrencySymbol(getCurrencySymbol(settData.currency));
            }
        } catch (err) {
            console.error('Failed to fetch ecommerce data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            fetchData();
        }
    }, [workspaceId]);

    const resetForm = () => setProductForm({
        name: '', description: '', price: '0.00', compare_price: '0.00',
        sku: '', barcode: '', stock_quantity: 0, track_quantity: false,
        continue_selling: false,
        has_variants: false, category: '', vendor: '', tags: '', note: '',
        status: 'active', image_url: '', collectionIds: []
    });

    const openAddForm = () => { resetForm(); setIsEditMode(false); setShowProductForm(true); };
    const openEditForm = (product) => {
        setProductForm({ 
            ...product, 
            price: product.price ?? '0.00', 
            compare_price: product.compare_price ?? '0.00',
            stock_quantity: product.stock_quantity ?? 0,
            continue_selling: product.continue_selling ?? false,
            collectionIds: product.ecommerce_collection_products?.map(p => p.collection_id) || []
        });
        setSelectedProduct(product);
        if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
            setVariantRows(product.product_variants.map(v => ({ label: v.option_value1 + (v.option_value2 ? ` / ${v.option_value2}` : ''), price: v.price, qty: v.quantity, sku: v.sku })));
        } else {
            setVariantRows([]);
        }
        setIsEditMode(true);
        setShowProductForm(true);
    };
    const closeForm = () => { setShowProductForm(false); setSelectedProduct(null); setVariantRows([]); };

    // Collection Handlers
    const resetCollectionForm = () => setCollectionForm({
        title: '', description: '', image_url: '', type: 'manual', matchType: 'all', 
        conditions: [{ field: 'Product Name', operator: 'contains', value: '' }],
        productIds: []
    });

    const openAddCollection = () => { resetCollectionForm(); setIsEditMode(false); setShowCollectionForm(true); };
    const openEditCollection = (collection) => {
        setCollectionForm({
            ...collection,
            matchType: collection.match_type || 'all',
            conditions: collection.ecommerce_collection_conditions?.length ? collection.ecommerce_collection_conditions : [{ field: 'Product Name', operator: 'contains', value: '' }],
            productIds: collection.ecommerce_collection_products?.map(p => p.product_id) || []
        });
        setSelectedProduct(collection); // Reusing this for ID tracking
        setIsEditMode(true);
        setShowCollectionForm(true);
    };
    const closeCollectionForm = () => { setShowCollectionForm(false); setShowProductPicker(false); };

    const handleSaveCollection = async (e) => {
        e.preventDefault();
        try {
            const { matchType, ecommerce_collection_conditions, ecommerce_collection_products, ...rest } = collectionForm;
            const payload = { ...rest, match_type: matchType };
            const url = isEditMode ? `${API_BASE}/collections/${selectedProduct.id}?workspaceId=${workspaceId}` : `${API_BASE}/collections?workspaceId=${workspaceId}`;
            const res = await authFetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                toast.success(isEditMode ? 'Collection updated' : 'Collection created');
                closeCollectionForm(); 
                fetchData(); 
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || errData.message || 'Failed to save collection');
            }
        } catch (err) {
            console.error('Failed to save collection:', err);
            toast.error('An error occurred while saving collection');
        }
    };

    const addCondition = () => {
        setCollectionForm(p => ({ ...p, conditions: [...p.conditions, { field: 'Product Name', operator: 'contains', value: '' }] }));
    };

    const updateCondition = (index, key, value) => {
        const newConds = [...collectionForm.conditions];
        newConds[index][key] = value;
        setCollectionForm(p => ({ ...p, conditions: newConds }));
    };

    const removeCondition = (index) => {
        if (collectionForm.conditions.length > 1) {
            setCollectionForm(p => ({ ...p, conditions: p.conditions.filter((_, i) => i !== index) }));
        }
    };

    // Discount Handlers
    const resetDiscountForm = () => setDiscountForm({
        code: '', type: 'percentage', percentage: 0, fixed_amount: 0, applies_to: 'entire', min_req: 'none',
        min_amount: '', min_qty: '', total_limit: false, total_limit_val: '', per_customer: false, startDate: '', endDate: '', codeError: false
    });

    const openAddDiscount = () => { resetDiscountForm(); setIsEditMode(false); setShowDiscountForm(true); };
    const openEditDiscount = (discount) => {
        setDiscountForm({
            ...discount,
            startDate: discount.start_date || '',
            endDate: discount.end_date || '',
            codeError: false
        });
        setSelectedProduct(discount);
        setIsEditMode(true);
        setShowDiscountForm(true);
    };
    const closeDiscountForm = () => setShowDiscountForm(false);

    const generateDiscountCode = (e) => {
        if(e) e.preventDefault();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        setDiscountForm(p => ({ ...p, code, codeError: false }));
    };

    const handleSaveDiscount = async (e) => {
        if(e) e.preventDefault();
        if(!discountForm.code.trim()) {
            setDiscountForm(p => ({ ...p, codeError: true }));
            return;
        }
        try {
            const { startDate, endDate, codeError, ...rest } = discountForm;
            const payload = { ...rest, start_date: startDate || null, end_date: endDate || null };
            const url = isEditMode ? `${API_BASE}/discounts/${selectedProduct.id}?workspaceId=${workspaceId}` : `${API_BASE}/discounts?workspaceId=${workspaceId}`;
            const res = await authFetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                toast.success(isEditMode ? 'Discount updated' : 'Discount created');
                closeDiscountForm(); 
                fetchData(); 
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || errData.message || 'Failed to save discount');
            }
        } catch (err) {
            console.error('Failed to save discount:', err);
            toast.error('An error occurred while saving');
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...productForm };
            if (productForm.has_variants) {
                payload.variants = variantRows.map(r => ({
                    option_name1: variantOptions[0]?.name || '',
                    option_value1: r.label.split(' / ')[0] || '',
                    option_name2: variantOptions[1]?.name || '',
                    option_value2: r.label.split(' / ')[1] || '',
                    price: r.price,
                    quantity: r.qty,
                    sku: r.sku
                }));
            }
            const res = await authFetch(`${API_BASE}/products?workspaceId=${workspaceId}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                toast.success('Product created successfully');
                closeForm(); 
                fetchData(); 
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || errData.message || 'Failed to create product');
            }
        } catch (err) {
            console.error('Failed to create product:', err);
            toast.error('An error occurred while creating product');
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...productForm };
            if (productForm.has_variants) {
                payload.variants = variantRows.map(r => ({
                    option_name1: variantOptions[0]?.name || '',
                    option_value1: r.label.split(' / ')[0] || '',
                    option_name2: variantOptions[1]?.name || '',
                    option_value2: r.label.split(' / ')[1] || '',
                    price: r.price,
                    quantity: r.qty,
                    sku: r.sku
                }));
            }
            const res = await authFetch(`${API_BASE}/products/${selectedProduct.id}?workspaceId=${workspaceId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                toast.success('Product updated successfully');
                closeForm(); 
                fetchData(); 
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || errData.message || 'Failed to update product');
            }
        } catch (err) {
            console.error('Failed to update product:', err);
            toast.error('An error occurred while updating product');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await authFetch(`${API_BASE}/products/${id}?workspaceId=${workspaceId}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Failed to delete product:', err);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const res = await authFetch(`${API_BASE}/orders/${orderId}/status?workspaceId=${workspaceId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        totalRevenue: orders.reduce((acc, o) => acc + (o.payment_status === 'paid' ? parseFloat(o.total_amount) : 0), 0),
        activeProducts: products.filter(p => p.status === 'active').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSales: orders.length
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Ecommerce Store</h2>

                    <div className="flex items-center gap-6 mt-4">
                        {[
                            { id: 'products', name: 'Products', icon: Package },
                            { id: 'collections', name: 'Collections', icon: Layers },
                            { id: 'discounts', name: 'Discounts', icon: Ticket },
                            { id: 'carts', name: 'Shopping Carts', icon: ShoppingCart },
                            { id: 'orders', name: 'Orders', icon: ClipboardList },
                            { id: 'settings', name: 'Settings', icon: Settings },
                            { id: 'tags', name: 'Tags', icon: Tag },
                            { id: 'vendors', name: 'Vendors', icon: Store },
                            { id: 'types', name: 'Types', icon: Box }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-sm font-bold pb-2 transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                <tab.icon size={16} />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'products' && (
                        <button 
                            onClick={openAddForm}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Product
                        </button>
                    )}
                    {activeTab === 'discounts' && (
                        <button 
                            onClick={openAddDiscount}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Create Discount
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                {activeTab === 'settings' && <EcommerceSettings onSave={fetchData} />}

                {activeTab === 'tags' && <EcommerceTags />}

                {activeTab === 'vendors' && <EcommerceVendors />}

                {activeTab === 'types' && <EcommerceTypes />}

                {['carts'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                            {activeTab === 'carts' && <ShoppingCart className="w-10 h-10 text-green-600" />}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')} Management
                        </h3>
                        <p className="text-slate-400 max-w-md mx-auto font-medium">
                            The {activeTab} management module is coming soon. This will allow you to fully control your store's resources.
                        </p>
                    </div>
                )}

                {activeTab === 'discounts' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {discounts.map(discount => (
                                <div key={discount.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                                <Ticket size={24} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">{discount.id}</span>
                                        </div>
                                        <h5 className="font-bold text-slate-800 text-lg mb-2">{discount.code}</h5>
                                        <p className="text-xs text-slate-400 font-medium mb-4">
                                            {discount.type === 'percentage' && `${discount.percentage}% off`}
                                            {discount.type === 'fixed' && `${currencySymbol}${discount.fixed_amount} off`}
                                            {discount.type === 'shipping' && 'Free shipping'}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                                {discount.applies_to}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                                Min: {discount.min_req}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <span className="text-xs font-medium text-slate-500">
                                                {discount.start_date ? new Date(discount.start_date).toLocaleDateString() : 'No start date'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => openEditDiscount(discount)}
                                                    className="text-slate-300 hover:text-green-500 transition-colors"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if(confirm('Delete this discount?')) {
                                                            const res = await authFetch(`${API_BASE}/discounts/${discount.id}?workspaceId=${workspaceId}`, { method: 'DELETE' });
                                                            if(res.ok) fetchData();
                                                        }
                                                    }}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {discounts.length === 0 && !loading && (
                            <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100">
                                <Ticket size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 mb-1">No discounts found</h3>
                                <p className="text-slate-400 max-w-xs mx-auto">Create a discount code to offer to your customers.</p>
                                <button onClick={openAddDiscount} className="mt-6 text-green-600 font-bold hover:underline">Create first discount</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {/* Toolbar - Exact match to Vendors/Types */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name" 
                                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[12.5px] focus:border-[#2196F3] focus:ring-4 focus:ring-[#2196F3]/10 outline-none transition-all w-[200px]"
                                        value={collectionSearch}
                                        onChange={e => setCollectionSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={openAddCollection}
                                className="flex items-center gap-2 px-4 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg text-[12.5px] font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Plus size={14} strokeWidth={3} />
                                Collection
                            </button>
                        </div>

                        <div className="space-y-3">
                            {collections.filter(c => c.title.toLowerCase().includes(collectionSearch.toLowerCase())).map(collection => (
                                <div key={collection.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#2196F3]/30 transition-all duration-300 p-3.5 flex items-center gap-4 group">
                                    {/* Compressed Image */}
                                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {collection.image_url ? (
                                            <img src={collection.image_url} alt={collection.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <Layers size={20} className="text-slate-300" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h5 className="font-bold text-slate-800 text-[14px] truncate">{collection.title}</h5>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${collection.type === 'auto' ? 'bg-blue-50 text-[#2196F3] border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                {collection.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11.5px] font-medium">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <Package size={12} />
                                                {collection.type === 'auto' ? 'Automated' : `${collection.ecommerce_collection_products?.length || 0} Products`}
                                            </span>
                                            {collection.type === 'auto' && (
                                                <span className="text-[#2196F3] bg-blue-50/50 px-2 py-0.5 rounded flex items-center gap-1.5 border border-blue-50">
                                                    <Filter size={10} />
                                                    {collection.ecommerce_collection_conditions?.length || 0} Conditions
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openEditCollection(collection)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:border-[#2196F3] hover:text-[#2196F3] hover:bg-blue-50 flex items-center justify-center transition-all"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {collections.length === 0 && !loading && (
                                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
                                    <Layers size={40} className="mx-auto text-slate-200 mb-3" />
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">No collections found</h3>
                                    <p className="text-[13px] text-slate-400 max-w-xs mx-auto">Create your first collection to group products.</p>
                                    <button onClick={openAddCollection} className="mt-5 text-[#2196F3] font-bold text-[13px] hover:underline">Create first collection</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {activeTab === 'products' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {/* Toolbar - Consistent with Collections/Vendors */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search products" 
                                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[12.5px] focus:border-[#2196F3] focus:ring-4 focus:ring-[#2196F3]/10 outline-none transition-all w-[200px]"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
                                    <Filter size={14} />
                                </button>
                            </div>
                            <button 
                                onClick={openAddForm}
                                className="flex items-center gap-2 px-4 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg text-[12.5px] font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Plus size={14} strokeWidth={3} />
                                Product
                            </button>
                        </div>

                        <div className="space-y-3">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#2196F3]/30 transition-all duration-300 p-3.5 flex items-center gap-4 group">
                                    {/* Product Image */}
                                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <Package size={20} className="text-slate-300" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h5 className="font-bold text-slate-800 text-[14px] truncate">{product.name}</h5>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${product.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                {product.status}
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-medium">#{product.id}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11.5px] font-medium">
                                            <span className="text-[#2196F3] flex items-center gap-1.5">
                                                <Tag size={12} />
                                                {product.category || 'Uncategorized'}
                                            </span>
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <Box size={12} />
                                                {product.stock_quantity} in stock
                                            </span>
                                            <span className="font-bold text-slate-900 ml-auto">
                                                {currencySymbol}{parseFloat(product.price).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openEditForm(product)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:border-[#2196F3] hover:text-[#2196F3] hover:bg-blue-50 flex items-center justify-center transition-all"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredProducts.length === 0 && !loading && (
                                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
                                    <Package size={40} className="mx-auto text-slate-200 mb-3" />
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">No products found</h3>
                                    <p className="text-[13px] text-slate-400 max-w-xs mx-auto">Add your first product to start selling.</p>
                                    <button onClick={openAddForm} className="mt-5 text-[#2196F3] font-bold text-[13px] hover:underline">Add first product</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Orders Table */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-slate-400 font-bold">Order info</th>
                                        <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-slate-400 font-bold">Customer</th>
                                        <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-slate-400 font-bold">Status</th>
                                        <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-slate-400 font-bold">Payment</th>
                                        <th className="px-8 py-5 text-[11px] uppercase tracking-widest text-slate-400 font-bold">Amount</th>
                                        <th className="px-8 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                        <ArrowUpRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">{new Date(order.created_at).toLocaleString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {order.contacts?.name?.charAt(0) || 'G'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{order.contacts?.name || 'Guest User'}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{order.contacts?.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <select 
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                    className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl border appearance-none cursor-pointer focus:outline-none transition-all ${
                                                        order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${order.payment_status === 'paid' ? 'text-green-600' : 'text-slate-400'}`}>
                                                        {order.payment_status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-800">{currencySymbol}{parseFloat(order.total_amount).toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{order.payment_method || 'STRIPE'}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <ShoppingCart size={40} className="mx-auto text-slate-100 mb-4" />
                                                <p className="text-slate-400 text-sm font-medium">No orders found in your store activity.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Full-Page Product Form Overlay */}
            {showProductForm && (
                <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {/* Top Bar */}
                    <header className="bg-white border-b border-slate-200 px-7 flex items-center justify-between sticky top-0 z-10" style={{ height: 56 }}>
                        <button
                            type="button"
                            onClick={closeForm}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                        >
                            <ChevronLeft size={16} /> Products
                        </button>
                        <span className="text-[15px] font-semibold text-slate-900">
                            {isEditMode ? 'Edit Product' : 'Add New Product'}
                        </span>
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="px-4 py-[7px] border border-slate-300 bg-white rounded-lg text-slate-700 text-[13px] font-medium hover:border-slate-400 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={isEditMode ? handleUpdateProduct : handleCreateProduct}
                                className="px-5 py-[7px] bg-green-500 hover:bg-green-600 text-white rounded-lg text-[13px] font-medium transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </header>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto">
                        <form
                            onSubmit={isEditMode ? handleUpdateProduct : handleCreateProduct}
                            className="grid gap-5 p-7"
                            style={{ gridTemplateColumns: '1fr 420px', alignItems: 'start' }}
                        >
                            {/* ── LEFT COLUMN ── */}
                            <div className="space-y-4">

                                {/* Title + Image */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="text-[12px] font-medium text-slate-700">Title</label>
                                                    <span className="text-[11px] text-slate-400">{productForm.name.length}/100</span>
                                                </div>
                                                <input
                                                    required
                                                    type="text"
                                                    maxLength={100}
                                                    placeholder="Product name"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all"
                                                    value={productForm.name}
                                                    onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="text-[12px] font-medium text-slate-700">Description</label>
                                                    <span className="text-[11px] text-slate-400">{productForm.description.length}/5000</span>
                                                </div>
                                                <textarea
                                                    maxLength={5000}
                                                    placeholder="Product description"
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all resize-y"
                                                    value={productForm.description}
                                                    onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">Image</label>
                                            <div
                                                onClick={() => imgInputRef.current?.click()}
                                                className="border-2 border-dashed border-slate-300 rounded-xl min-h-[130px] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-green-500 hover:bg-green-50/40 transition-all relative"
                                            >
                                                {productForm.image_url ? (
                                                    <img src={productForm.image_url} alt="preview" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <ImagePlus size={28} className="text-slate-300" />
                                                        <span className="text-[12px] text-slate-400">Click to upload</span>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                ref={imgInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const url = await handleImageUpload(file, 'products');
                                                        if (url) setProductForm(p => ({ ...p, image_url: url }));
                                                    }
                                                }}
                                            />
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                                                    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-900">
                                            Pricing
                                            <span className="bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-[12px] text-slate-600 font-medium">
                                                {currencySymbol}{parseFloat(productForm.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <label className="flex items-center gap-1.5 text-[12px] text-blue-600 cursor-pointer">
                                            <input type="checkbox" className="accent-blue-500" defaultChecked />
                                            Charge tax on this product
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">Price ({currencySymbol})</label>
                                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                                                <button type="button" onClick={() => setProductForm(p => ({ ...p, price: Math.max(0, parseFloat(p.price||0) - 1).toFixed(2) }))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"><Minus size={14} /></button>
                                                <input type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="flex-1 text-center border-none outline-none text-[13px] text-slate-700 py-2 px-1" />
                                                <button type="button" onClick={() => setProductForm(p => ({ ...p, price: (parseFloat(p.price||0) + 1).toFixed(2) }))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                                                Compare at price ({currencySymbol})
                                                <span className="w-3.5 h-3.5 bg-slate-300 text-white rounded-full text-[9px] font-bold flex items-center justify-center">?</span>
                                            </label>
                                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                                                <button type="button" onClick={() => setProductForm(p => ({ ...p, compare_price: Math.max(0, parseFloat(p.compare_price||0) - 1).toFixed(2) }))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"><Minus size={14} /></button>
                                                <input type="number" step="0.01" min="0" value={productForm.compare_price} onChange={e => setProductForm(p => ({ ...p, compare_price: e.target.value }))} className="flex-1 text-center border-none outline-none text-[13px] text-slate-700 py-2 px-1" />
                                                <button type="button" onClick={() => setProductForm(p => ({ ...p, compare_price: (parseFloat(p.compare_price||0) + 1).toFixed(2) }))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live price comparison preview */}
                                    {parseFloat(productForm.compare_price || 0) > parseFloat(productForm.price || 0) && parseFloat(productForm.price || 0) > 0 && (
                                        <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Preview</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[15px] font-bold text-green-600">{currencySymbol}{parseFloat(productForm.price).toFixed(2)}</span>
                                                <span className="text-[13px] text-slate-400 line-through">{currencySymbol}{parseFloat(productForm.compare_price).toFixed(2)}</span>
                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                                    {Math.round((1 - parseFloat(productForm.price) / parseFloat(productForm.compare_price)) * 100)}% OFF
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Inventory</p>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">SKU (Product Retailer Id)</label>
                                            <input type="text" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">Barcode (ISBN, UPC, GTIN, etc.)</label>
                                            <input type="text" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" value={productForm.barcode} onChange={e => setProductForm(p => ({ ...p, barcode: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                                            <input type="checkbox" className="accent-green-500 w-[15px] h-[15px]" checked={productForm.track_quantity} onChange={e => setProductForm(p => ({ ...p, track_quantity: e.target.checked }))} />
                                            Track quantity
                                        </label>

                                        {productForm.track_quantity && (
                                            <div className="pl-6 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                                                    <input type="checkbox" className="accent-green-500 w-[15px] h-[15px]" checked={productForm.continue_selling} onChange={e => setProductForm(p => ({ ...p, continue_selling: e.target.checked }))} />
                                                    Continue selling when out of stock
                                                </label>

                                                <div className="pt-2">
                                                    <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">Quantity available</label>
                                                    <div className="flex items-center w-[160px] border border-slate-300 rounded-lg overflow-hidden focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/10 transition-all bg-white h-10">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setProductForm(p => ({ ...p, stock_quantity: Math.max(0, (p.stock_quantity || 0) - 1) }))} 
                                                            className="w-10 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 border-r border-slate-200 transition-all flex-shrink-0"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input 
                                                            type="number" 
                                                            value={productForm.stock_quantity} 
                                                            onChange={e => setProductForm(p => ({ ...p, stock_quantity: parseInt(e.target.value || 0) }))} 
                                                            className="w-full text-center border-none outline-none text-[14px] font-bold text-slate-700 py-2 bg-transparent min-w-0" 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setProductForm(p => ({ ...p, stock_quantity: (p.stock_quantity || 0) + 1 }))} 
                                                            className="w-10 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 border-l border-slate-200 transition-all flex-shrink-0"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Variants */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3">Variants</p>
                                    <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                                        <input type="checkbox" className="accent-green-500 w-[15px] h-[15px]" checked={productForm.has_variants} onChange={e => { setProductForm(p => ({ ...p, has_variants: e.target.checked })); if (!e.target.checked) { setVariantOptions([{ name: '', values: [], inputValue: '' }, { name: '', values: [], inputValue: '' }]); setVariantRows([]); } }} />
                                        This product has multiple options, like different sizes or colors
                                    </label>

                                    {productForm.has_variants && (
                                        <div className="mt-4 pt-4 border-t border-slate-100" style={{ animation: 'fadeIn 0.2s ease' }}>
                                            {variantOptions.map((opt, optIdx) => (
                                                <div key={optIdx} className="mb-4 relative group">
                                                    <div className="grid gap-3" style={{ gridTemplateColumns: '180px 1fr' }}>
                                                        <div>
                                                            <label className="text-[12px] font-semibold text-slate-700 mb-1.5 block flex items-center justify-between">
                                                                Option {optIdx + 1}
                                                                {variantOptions.length > 1 && (
                                                                    <button type="button" onClick={() => { setVariantOptions(p => p.filter((_, i) => i !== optIdx)); setTimeout(refreshVariantRows, 50); }} className="text-red-400 hover:text-red-600 text-[10px] font-bold">Remove</button>
                                                                )}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder={optIdx === 0 ? 'e.g. Size' : optIdx === 1 ? 'e.g. Color' : 'e.g. Material'}
                                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all"
                                                                value={opt.name}
                                                                onChange={e => updateVariantOptionName(optIdx, e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[12px] font-semibold text-slate-700 mb-1.5 block">Option Values</label>
                                                            <div className="flex items-center flex-wrap gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 min-h-[38px] focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/10 transition-all bg-white">
                                                                {opt.values.map((val, valIdx) => (
                                                                    <span key={valIdx} className="inline-flex items-center gap-1 bg-green-500 text-white rounded px-2 py-0.5 text-[11px] font-medium">
                                                                        {val}
                                                                        <span className="cursor-pointer hover:text-red-200 text-[13px] leading-none" onClick={() => removeVariantValue(optIdx, valIdx)}>×</span>
                                                                    </span>
                                                                ))}
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 min-w-[80px] border-none outline-none text-[13px] text-slate-700 py-0.5 bg-transparent"
                                                                    placeholder="Add option"
                                                                    value={opt.inputValue}
                                                                    onChange={e => updateVariantInputValue(optIdx, e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVariantValue(optIdx); } }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {variantOptions.length < 3 && (
                                                <div className="mb-6">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setVariantOptions(p => [...p, { name: '', values: [], inputValue: '' }])}
                                                        className="flex items-center gap-2 text-[#2196F3] font-bold text-[12.5px] hover:text-[#1976D2] transition-all bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                        Add another option
                                                    </button>
                                                </div>
                                            )}

                                            {/* Preview Table */}
                                            {variantRows.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Preview</p>
                                                    <table className="w-full border-collapse text-left">
                                                        <thead>
                                                            <tr className="border-b border-slate-100">
                                                                <th className="text-[11px] font-semibold text-green-600 pb-2 pr-4">Variant ↓</th>
                                                                <th className="text-[11px] font-semibold text-green-600 pb-2 pr-4" style={{ width: 140 }}>Price ({currencySymbol})</th>
                                                                <th className="text-[11px] font-semibold text-green-600 pb-2 pr-4" style={{ width: 120 }}>Quantity</th>
                                                                <th className="text-[11px] font-semibold text-green-600 pb-2">SKU (Product Retailer Id)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {variantRows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="border-b border-slate-50">
                                                                    <td className="py-3 pr-4 text-[12.5px] font-bold text-slate-700">{row.label}</td>
                                                                    <td className="py-3 pr-4">
                                                                        <div className="flex items-center w-[130px] border border-slate-300 rounded-lg overflow-hidden focus-within:border-green-500 transition-all bg-white h-9">
                                                                            <button type="button" onClick={() => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, price: Math.max(0, parseFloat(r.price || 0) - 1).toFixed(2) } : r))} className="w-8 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 border-r border-slate-200 flex-shrink-0">
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <input type="text" className="w-full text-center border-none outline-none text-[13px] font-bold text-slate-700 py-1 bg-transparent min-w-0" value={row.price} onChange={e => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, price: e.target.value } : r))} />
                                                                            <button type="button" onClick={() => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, price: (parseFloat(r.price || 0) + 1).toFixed(2) } : r))} className="w-8 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 border-l border-slate-200 flex-shrink-0">
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 pr-4">
                                                                        <div className="flex items-center w-[110px] border border-slate-300 rounded-lg overflow-hidden focus-within:border-green-500 transition-all bg-white h-9">
                                                                            <button type="button" onClick={() => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, qty: Math.max(0, parseInt(r.qty || 0) - 1) } : r))} className="w-8 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 border-r border-slate-200 flex-shrink-0">
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <input type="number" className="w-full text-center border-none outline-none text-[13px] font-bold text-slate-700 py-1 bg-transparent min-w-0" value={row.qty} onChange={e => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, qty: e.target.value } : r))} />
                                                                            <button type="button" onClick={() => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, qty: parseInt(r.qty || 0) + 1 } : r))} className="w-8 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 border-l border-slate-200 flex-shrink-0">
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3">
                                                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all h-9" value={row.sku} onChange={e => setVariantRows(prev => prev.map((r, i) => i === rIdx ? { ...r, sku: e.target.value } : r))} />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* ── RIGHT COLUMN ── */}
                            <div className="space-y-4">

                                {/* Availability */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Product availability</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-medium text-slate-600">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium" style={{ color: productForm.status === 'active' ? '#16a34a' : '#ef4444' }}>
                                                {productForm.status === 'active' ? 'AVAILABLE' : 'NOT AVAILABLE'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setProductForm(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
                                                className={`relative w-9 h-5 rounded-full transition-all duration-200 ${productForm.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${productForm.status === 'active' ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[13px] font-semibold text-slate-900">Note</p>
                                        <span className="text-[11px] text-slate-400">For internal use</span>
                                    </div>
                                    <div className="flex justify-end mb-1.5">
                                        <span className="text-[11px] text-slate-400">{productForm.note.length}/1000</span>
                                    </div>
                                    <textarea
                                        maxLength={1000}
                                        placeholder="Note"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all resize-y"
                                        value={productForm.note}
                                        onChange={e => setProductForm(p => ({ ...p, note: e.target.value }))}
                                    />
                                </div>

                                {/* Organization */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Organization</p>
                                    <div className="space-y-3.5">
                                        {/* Product Type Dropdown */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[12px] font-medium text-slate-700">Product type</label>
                                                <span className="text-[10px] text-slate-400">Choose existing or type new</span>
                                            </div>
                                            <div className="relative">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Choose product type or type to add new" 
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" 
                                                        value={productForm.category} 
                                                        onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                                                        onFocus={() => setOpenDropdown('type')}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                                {openDropdown === 'type' && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {[...new Set([...typesList.map(t => t.name), ...products.map(p => p.category).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.category || '').toLowerCase())).length === 0 ? (
                                                            <div className="px-3 py-2 text-[12px] text-slate-400 italic">No matches found. Press enter to add.</div>
                                                        ) : (
                                                            [...new Set([...typesList.map(t => t.name), ...products.map(p => p.category).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.category || '').toLowerCase())).map((val, idx) => (
                                                                <button key={idx} onClick={() => { setProductForm(p => ({ ...p, category: val })); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 transition-colors">
                                                                    {val}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vendor Dropdown */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[12px] font-medium text-slate-700">Vendor</label>
                                                <span className="text-[10px] text-slate-400">Choose existing or type new</span>
                                            </div>
                                            <div className="relative">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Choose vendor or type to add new" 
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" 
                                                        value={productForm.vendor} 
                                                        onChange={e => setProductForm(p => ({ ...p, vendor: e.target.value }))}
                                                        onFocus={() => setOpenDropdown('vendor')}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                                {openDropdown === 'vendor' && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {[...new Set([...vendorsList.map(v => v.name), ...products.map(p => p.vendor).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.vendor || '').toLowerCase())).length === 0 ? (
                                                            <div className="px-3 py-2 text-[12px] text-slate-400 italic">No matches found.</div>
                                                        ) : (
                                                            [...new Set([...vendorsList.map(v => v.name), ...products.map(p => p.vendor).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.vendor || '').toLowerCase())).map((val, idx) => (
                                                                <button key={idx} onClick={() => { setProductForm(p => ({ ...p, vendor: val })); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 transition-colors">
                                                                    {val}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tags Dropdown */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-[12px] font-medium text-slate-700">Tags</label>
                                                <span className="text-[10px] text-slate-400">Comma separated</span>
                                            </div>
                                            <div className="relative">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="tag1, tag2, tag3" 
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-[13px] text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" 
                                                        value={productForm.tags} 
                                                        onChange={e => setProductForm(p => ({ ...p, tags: e.target.value }))}
                                                        onFocus={() => setOpenDropdown('tag')}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                                {openDropdown === 'tag' && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {[...new Set([...tagsList.map(t => t.name), ...products.flatMap(p => (p.tags || '').split(',').map(t => t.trim())).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.tags || '').toLowerCase().split(',').pop().trim())).length === 0 ? (
                                                            <div className="px-3 py-2 text-[12px] text-slate-400 italic">No matches found.</div>
                                                        ) : (
                                                            [...new Set([...tagsList.map(t => t.name), ...products.flatMap(p => (p.tags || '').split(',').map(t => t.trim())).filter(Boolean)])].filter(v => v.toLowerCase().includes((productForm.tags || '').toLowerCase().split(',').pop().trim())).map((val, idx) => (
                                                                <button key={idx} onClick={() => { 
                                                                    const parts = productForm.tags.split(',').map(t => t.trim());
                                                                    parts[parts.length - 1] = val;
                                                                    setProductForm(p => ({ ...p, tags: parts.join(', ') + ', ' })); 
                                                                    setOpenDropdown(null); 
                                                                }} className="w-full text-left px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 transition-colors">
                                                                    {val}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5 mt-2">
                                                <label className="text-[12px] font-medium text-slate-700">Collections</label>
                                                <span className="text-[10px] text-slate-400">Manual only</span>
                                            </div>
                                            <div className="max-h-[120px] overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-1 bg-slate-50/30">
                                                {collections.filter(c => c.type === 'manual').length === 0 ? (
                                                    <div className="text-[11px] text-slate-400 p-1 text-center">No manual collections available.</div>
                                                ) : collections.filter(c => c.type === 'manual').map(c => (
                                                    <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-md cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={productForm.collectionIds?.includes(c.id) || false}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setProductForm(prev => ({ ...prev, collectionIds: [...(prev.collectionIds || []), c.id] }));
                                                                } else {
                                                                    setProductForm(prev => ({ ...prev, collectionIds: (prev.collectionIds || []).filter(id => id !== c.id) }));
                                                                }
                                                            }}
                                                            className="w-3.5 h-3.5 text-green-600 rounded border-slate-300 focus:ring-green-500 cursor-pointer"
                                                        />
                                                        <span className="text-[12px] text-slate-700 font-medium">{c.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* System IDs */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Product ID</span>
                                        <span className="text-[12px] text-slate-700 font-mono bg-white px-3 py-2 border border-slate-200 rounded-lg block truncate w-full">
                                            {selectedProduct?.id || 'Generates after save'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Variant ID</span>
                                        <span className="text-[12px] text-slate-700 font-mono bg-white px-3 py-2 border border-slate-200 rounded-lg block truncate w-full">
                                            {selectedProduct?.id ? `${selectedProduct.id.split('-')[0]}-var1` : 'Generates after save'}
                                        </span>
                                    </div>
                                </div>

                            </div>

                        </form>

                        {/* Bottom Save */}
                        <div className="flex justify-end gap-3 px-7 pb-8">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isEditMode) {
                                        handleDeleteProduct(selectedProduct.id);
                                    }
                                    closeForm();
                                }}
                                className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-[13px] font-medium transition-all mr-auto border border-red-200"
                            >
                                Delete Product
                            </button>
                            <button
                                type="button"
                                onClick={isEditMode ? handleUpdateProduct : handleCreateProduct}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[13px] font-medium transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-Page Collection Form Overlay */}
            {showCollectionForm && (
                <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {/* Top Bar */}
                    <header className="bg-white border-b border-slate-200 px-7 flex items-center justify-between sticky top-0 z-10" style={{ height: 56 }}>
                        <button type="button" onClick={closeCollectionForm} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                            <ChevronLeft size={16} /> Collections
                        </button>
                        <div className="flex items-center gap-2.5">
                            <button type="button" onClick={closeCollectionForm} className="px-4 py-[7px] border border-slate-300 bg-white rounded-lg text-slate-700 text-[13px] font-medium hover:border-slate-400 transition-all">Cancel</button>
                            <button type="button" onClick={handleSaveCollection} className="px-5 py-[7px] bg-green-600 hover:bg-green-700 text-white rounded-lg text-[13px] font-medium transition-all">Save</button>
                        </div>
                    </header>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSaveCollection} className="grid gap-5 p-7" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start', maxWidth: 1100, margin: '0 auto' }}>
                            {/* ── LEFT COLUMN ── */}
                            <div className="space-y-4">
                                {/* Title & Description */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Details</p>
                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1 block">Title</label>
                                            <input type="text" placeholder="Collection name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" value={collectionForm.title} onChange={e => setCollectionForm(prev => ({ ...prev, title: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-[12px] font-medium text-slate-700 mb-1 block">Description</label>
                                            <textarea placeholder="Collection description" rows={4} maxLength={300} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all resize-none" value={collectionForm.description} onChange={e => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}></textarea>
                                            <div className="text-right text-[10.5px] text-slate-400 mt-1">{collectionForm.description.length} / 300</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Image */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Image</p>
                                    <div onClick={() => collectionImgRef.current?.click()} className="border-[1.5px] border-dashed border-slate-300 rounded-[9px] h-[160px] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-green-600 hover:bg-green-50/50 transition-all bg-slate-50 overflow-hidden relative">
                                        {collectionForm.image_url ? (
                                            <img src={collectionForm.image_url} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <ImagePlus size={28} className="text-slate-400" />
                                                <span className="text-[12px] text-slate-400">Drop image here, or</span>
                                                <span className="text-[12px] font-semibold text-green-600">Browse files</span>
                                            </>
                                        )}
                                        <input ref={collectionImgRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const url = await handleImageUpload(file, 'collections');
                                                if (url) setCollectionForm(p => ({ ...p, image_url: url }));
                                            }
                                        }} />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* ── RIGHT COLUMN ── */}
                            <div className="space-y-4">
                                {/* Type Options */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Collection Type</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div onClick={() => setCollectionForm(p => ({ ...p, type: 'manual' }))} className={`border-[1.5px] rounded-[9px] p-3.5 cursor-pointer transition-all ${collectionForm.type === 'manual' ? 'border-green-600 bg-green-50/50' : 'border-slate-200 hover:border-green-600 hover:bg-green-50/50'}`}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${collectionForm.type === 'manual' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                    {collectionForm.type === 'manual' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                                </div>
                                                <span className="text-[13px] font-semibold text-slate-800">Manual</span>
                                            </div>
                                            <div className="text-[11.5px] text-slate-500 leading-relaxed">Add products to this collection one by one.</div>
                                        </div>
                                        <div onClick={() => setCollectionForm(p => ({ ...p, type: 'auto' }))} className={`border-[1.5px] rounded-[9px] p-3.5 cursor-pointer transition-all ${collectionForm.type === 'auto' ? 'border-green-600 bg-green-50/50' : 'border-slate-200 hover:border-green-600 hover:bg-green-50/50'}`}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${collectionForm.type === 'auto' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                    {collectionForm.type === 'auto' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                                </div>
                                                <span className="text-[13px] font-semibold text-slate-800">Automated</span>
                                            </div>
                                            <div className="text-[11.5px] text-slate-500 leading-relaxed">Products matching conditions will be added automatically.</div>
                                        </div>
                                    </div>
                                    
                                    {/* Conditions */}
                                    {collectionForm.type === 'auto' && (
                                        <div className="mt-3.5 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <p className="text-[13px] font-semibold text-slate-800 mb-2.5">Conditions</p>
                                            <div className="flex items-center gap-3.5 mb-3 flex-wrap">
                                                <span className="text-[12px] text-slate-700">Products must match</span>
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="radio" className="hidden" checked={collectionForm.matchType === 'all'} onChange={() => setCollectionForm(p => ({ ...p, matchType: 'all' }))} />
                                                    <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${collectionForm.matchType === 'all' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                        {collectionForm.matchType === 'all' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                                    </div>
                                                    <span className={`text-[12px] transition-colors ${collectionForm.matchType === 'all' ? 'text-green-600 font-medium' : 'text-slate-500'}`}>all conditions</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="radio" className="hidden" checked={collectionForm.matchType === 'any'} onChange={() => setCollectionForm(p => ({ ...p, matchType: 'any' }))} />
                                                    <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${collectionForm.matchType === 'any' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                        {collectionForm.matchType === 'any' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                                    </div>
                                                    <span className={`text-[12px] transition-colors ${collectionForm.matchType === 'any' ? 'text-green-600 font-medium' : 'text-slate-500'}`}>any condition</span>
                                                </label>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {collectionForm.conditions.map((cond, idx) => (
                                                    <div key={idx} className="grid gap-[7px] items-center" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                                                        <select value={cond.field} onChange={e => updateCondition(idx, 'field', e.target.value)} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 outline-none focus:border-green-600 cursor-pointer bg-white h-[36px]">
                                                            <option>Product Name</option>
                                                            <option>Product Type</option>
                                                            <option>Product Vendor</option>
                                                            <option>Product Tag</option>
                                                            <option>Product Price</option>
                                                        </select>
                                                        <select value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 outline-none focus:border-green-600 cursor-pointer bg-white h-[36px]">
                                                            <option>contains</option>
                                                            <option>is equal to</option>
                                                            <option>is not equal to</option>
                                                            <option>does not contain</option>
                                                            <option>starts with</option>
                                                            <option>ends with</option>
                                                        </select>
                                                        <input type="text" value={cond.value} onChange={e => updateCondition(idx, 'value', e.target.value)} maxLength={30} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[12.5px] text-slate-900 outline-none focus:border-green-600 bg-white h-[36px]" />
                                                        <button type="button" onClick={() => removeCondition(idx)} className="w-[28px] h-[28px] rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0">
                                                            <X size={14} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button type="button" onClick={addCondition} className="w-full flex items-center justify-center py-[9px] mt-1.5 border-[1.5px] border-dashed border-green-300 bg-transparent text-green-600 rounded-lg text-[12px] font-medium hover:bg-green-50/50 transition-all">
                                                Add another condition
                                            </button>

                                            {/* Matching Products Preview */}
                                            <div className="mt-5 pt-4 border-t border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Matching Products (Preview)</p>
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                    {products.filter(product => {
                                                        if (!collectionForm.conditions || collectionForm.conditions.length === 0) return false;
                                                        const results = collectionForm.conditions.map(cond => {
                                                            let val = '';
                                                            if (cond.field === 'Product Name') val = product.name;
                                                            else if (cond.field === 'Product Type') val = product.category;
                                                            else if (cond.field === 'Product Vendor') val = product.vendor;
                                                            else if (cond.field === 'Product Tag') val = product.tags;
                                                            else if (cond.field === 'Product Price') val = String(product.price);
                                                            val = (val || '').toLowerCase();
                                                            const search = (cond.value || '').toLowerCase();
                                                            switch(cond.operator) {
                                                                case 'contains': return val.includes(search);
                                                                case 'is equal to': return val === search;
                                                                case 'is not equal to': return val !== search;
                                                                case 'does not contain': return !val.includes(search);
                                                                case 'starts with': return val.startsWith(search);
                                                                case 'ends with': return val.endsWith(search);
                                                                default: return false;
                                                            }
                                                        });
                                                        return collectionForm.matchType === 'all' ? results.every(r => r) : results.some(r => r);
                                                    }).length === 0 ? (
                                                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                                            <p className="text-[12px] text-slate-400">No products match these conditions.</p>
                                                        </div>
                                                    ) : (
                                                        products.filter(product => {
                                                            const results = collectionForm.conditions.map(cond => {
                                                                let val = '';
                                                                if (cond.field === 'Product Name') val = product.name;
                                                                else if (cond.field === 'Product Type') val = product.category;
                                                                else if (cond.field === 'Product Vendor') val = product.vendor;
                                                                else if (cond.field === 'Product Tag') val = product.tags;
                                                                else if (cond.field === 'Product Price') val = String(product.price);
                                                                val = (val || '').toLowerCase();
                                                                const search = (cond.value || '').toLowerCase();
                                                                switch(cond.operator) {
                                                                    case 'contains': return val.includes(search);
                                                                    case 'is equal to': return val === search;
                                                                    case 'is not equal to': return val !== search;
                                                                    case 'does not contain': return !val.includes(search);
                                                                    case 'starts with': return val.startsWith(search);
                                                                    case 'ends with': return val.endsWith(search);
                                                                    default: return false;
                                                                }
                                                            });
                                                            return collectionForm.matchType === 'all' ? results.every(r => r) : results.some(r => r);
                                                        }).map(p => (
                                                            <div key={p.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-300" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                                                                        <p className="text-[11px] text-slate-400 font-medium">{currencySymbol}{parseFloat(p.price).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Products */}
                                    {collectionForm.type === 'manual' && (
                                        <div className="mt-3.5 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex justify-between items-center mb-2.5">
                                                <p className="text-[13px] font-semibold text-slate-800">Products</p>
                                                <button type="button" onClick={() => setShowProductPicker(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-green-600 hover:text-green-700">
                                                    <Plus size={14} /> Add Product
                                                </button>
                                            </div>
                                            
                                            {collectionForm.productIds?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {collectionForm.productIds.map(pid => {
                                                        const p = products.find(prod => prod.id === pid);
                                                        if (!p) return null;
                                                        return (
                                                            <div key={pid} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                                                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-300" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                                                                        <p className="text-[11px] text-slate-400 font-medium">{currencySymbol}{parseFloat(p.price).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            closeCollectionForm();
                                                                            openEditForm(p);
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                                        title="View Product"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => setCollectionForm(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== pid) }))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                                    <p className="text-[12px] text-slate-500 mb-2">No products added yet.</p>
                                                    <button type="button" onClick={() => setShowProductPicker(true)} className="text-[12px] font-medium text-green-600 hover:underline">Browse Products</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                        
                        <div className="h-[1px] bg-slate-200 mx-7"></div>
                        <div className="flex justify-between items-center px-7 py-4 pb-8">
                            <div>
                                {selectedProduct && (
                                    <button 
                                        type="button" 
                                        onClick={async () => {
                                            if(confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
                                                try {
                                                    const res = await authFetch(`${API_BASE}/collections/${selectedProduct.id}?workspaceId=${workspaceId}`, { method: 'DELETE' });
                                                    if(res.ok) {
                                                        toast.success('Collection deleted successfully');
                                                        fetchData();
                                                        closeCollectionForm();
                                                    } else {
                                                        toast.error('Failed to delete collection');
                                                    }
                                                } catch (err) {
                                                    toast.error('An error occurred while deleting');
                                                }
                                            }
                                        }}
                                        className="px-6 py-[7px] bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-[12.5px] font-bold transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        Delete Collection
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={closeCollectionForm} className="px-4 py-[7px] border border-slate-200 bg-transparent text-slate-700 rounded-lg text-[12.5px] font-medium hover:bg-slate-100 transition-all">Cancel</button>
                                <button type="button" onClick={handleSaveCollection} className="px-4 py-[7px] bg-green-600 text-white rounded-lg text-[12.5px] font-medium hover:bg-green-700 transition-all">Save Collection</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-Page Discount Form Overlay */}
            {showDiscountForm && (
                <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <header className="bg-white border-b border-slate-200 px-7 flex items-center justify-between sticky top-0 z-10" style={{ height: 56 }}>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={closeDiscountForm} className="flex items-center gap-1 text-slate-500 hover:text-green-600 text-[12.5px] font-medium transition-colors">
                                <ChevronLeft size={14} /> Discounts
                            </button>
                        </div>
                        <span className="text-[15px] font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">Create discount code</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={closeDiscountForm} className="px-4 py-[7px] border border-slate-200 bg-transparent text-slate-700 rounded-lg text-[12.5px] font-medium hover:bg-slate-100 transition-all">Cancel</button>
                            <button type="button" onClick={handleSaveDiscount} className="px-[18px] py-[7px] bg-green-600 hover:bg-green-700 text-white rounded-lg text-[12.5px] font-medium transition-all">Save</button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid gap-4 p-5 pb-10" style={{ gridTemplateColumns: '1fr 300px', maxWidth: 1200, margin: '0 auto' }}>
                            <div className="flex flex-col gap-3.5">
                                {/* Discount Code */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[13px] font-semibold text-slate-900">Discount Code</span>
                                        <button type="button" onClick={generateDiscountCode} className="text-[12px] font-medium text-green-600 hover:text-green-700 hover:underline">Generate code</button>
                                    </div>
                                    <input type="text" placeholder="e.g. SALE123" value={discountForm.code} onChange={e => setDiscountForm(p => ({ ...p, code: e.target.value.toUpperCase(), codeError: false }))} className={`w-full px-3 py-2 border rounded-lg text-[12.5px] font-medium outline-none focus:ring-2 transition-all uppercase ${discountForm.codeError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-green-600 focus:ring-green-600/10'}`} />
                                    {discountForm.codeError && <div className="text-[11px] text-red-500 mt-1">Please enter discount code</div>}
                                    <div className="text-[11px] text-slate-400 mt-1.5">Customers will enter this discount code at checkout.</div>
                                </div>

                                {/* Types */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Types</p>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.type === 'percentage'} onChange={() => setDiscountForm(p => ({ ...p, type: 'percentage' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.type === 'percentage' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.type === 'percentage' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div>
                                                <span className={`text-[12.5px] transition-colors ${discountForm.type === 'percentage' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Percentage</span>
                                                {discountForm.type === 'percentage' && (
                                                    <div className="mt-2.5 mb-1 animate-in fade-in slide-in-from-top-1">
                                                        <div className="text-[11px] text-slate-500 mb-1">Discount percentage (%)</div>
                                                        <div className="flex items-center w-[110px] border border-slate-200 rounded-lg overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/10 transition-all bg-white h-[32px]">
                                                            <input type="number" value={discountForm.percentage} onChange={e => setDiscountForm(p => ({ ...p, percentage: Math.min(100, Math.max(0, parseInt(e.target.value || 0))) }))} className="w-[70px] text-center text-[13px] font-medium py-1 outline-none border-none shadow-none" min="0" max="100" />
                                                            <div className="flex flex-col border-l border-slate-200 h-full w-[40px]">
                                                                <button type="button" onClick={() => setDiscountForm(p => ({ ...p, percentage: Math.min(100, (p.percentage || 0) + 1) }))} className="flex-1 border-b border-slate-200 hover:bg-slate-100 flex items-center justify-center text-[8px] text-slate-500">▲</button>
                                                                <button type="button" onClick={() => setDiscountForm(p => ({ ...p, percentage: Math.max(0, (p.percentage || 0) - 1) }))} className="flex-1 hover:bg-slate-100 flex items-center justify-center text-[8px] text-slate-500">▼</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.type === 'fixed'} onChange={() => setDiscountForm(p => ({ ...p, type: 'fixed' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.type === 'fixed' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.type === 'fixed' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div>
                                                <span className={`text-[12.5px] transition-colors ${discountForm.type === 'fixed' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Fixed amount</span>
                                                {discountForm.type === 'fixed' && (
                                                    <div className="mt-2.5 mb-1 animate-in fade-in slide-in-from-top-1">
                                                        <div className="text-[11px] text-slate-500 mb-1">Discount amount ({currencySymbol})</div>
                                                        <div className="flex items-center w-[110px] border border-slate-200 rounded-lg overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/10 transition-all bg-white h-[32px]">
                                                            <input type="number" value={discountForm.fixed_amount} onChange={e => setDiscountForm(p => ({ ...p, fixed_amount: Math.max(0, parseInt(e.target.value || 0)) }))} className="w-[70px] text-center text-[13px] font-medium py-1 outline-none border-none shadow-none" min="0" />
                                                            <div className="flex flex-col border-l border-slate-200 h-full w-[40px]">
                                                                <button type="button" onClick={() => setDiscountForm(p => ({ ...p, fixed_amount: (p.fixed_amount || 0) + 1 }))} className="flex-1 border-b border-slate-200 hover:bg-slate-100 flex items-center justify-center text-[8px] text-slate-500">▲</button>
                                                                <button type="button" onClick={() => setDiscountForm(p => ({ ...p, fixed_amount: Math.max(0, (p.fixed_amount || 0) - 1) }))} className="flex-1 hover:bg-slate-100 flex items-center justify-center text-[8px] text-slate-500">▼</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.type === 'shipping'} onChange={() => setDiscountForm(p => ({ ...p, type: 'shipping' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.type === 'shipping' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.type === 'shipping' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <span className={`text-[12.5px] transition-colors ${discountForm.type === 'shipping' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Free shipping</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Applies To */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Applies To</p>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.applies_to === 'entire'} onChange={() => setDiscountForm(p => ({ ...p, applies_to: 'entire' }))} />
                                            <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.applies_to === 'entire' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.applies_to === 'entire' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <span className={`text-[12.5px] transition-colors ${discountForm.applies_to === 'entire' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Entire order</span>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.applies_to === 'collections'} onChange={() => setDiscountForm(p => ({ ...p, applies_to: 'collections' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.applies_to === 'collections' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.applies_to === 'collections' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div className="flex-1 w-full relative">
                                                <span className={`text-[12.5px] transition-colors ${discountForm.applies_to === 'collections' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Specific collections</span>
                                                {discountForm.applies_to === 'collections' && (
                                                    <div className="mt-2.5 relative animate-in fade-in slide-in-from-top-1 w-full max-w-sm">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                                        <input type="text" placeholder="Search collections..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.applies_to === 'products'} onChange={() => setDiscountForm(p => ({ ...p, applies_to: 'products' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.applies_to === 'products' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.applies_to === 'products' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div className="flex-1 w-full relative">
                                                <span className={`text-[12.5px] transition-colors ${discountForm.applies_to === 'products' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Specific products</span>
                                                {discountForm.applies_to === 'products' && (
                                                    <div className="mt-2.5 relative animate-in fade-in slide-in-from-top-1 w-full max-w-sm">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                                        <input type="text" placeholder="Search products..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Minimum Requirements */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Minimum requirements</p>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.min_req === 'none'} onChange={() => setDiscountForm(p => ({ ...p, min_req: 'none' }))} />
                                            <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.min_req === 'none' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.min_req === 'none' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <span className={`text-[12.5px] transition-colors ${discountForm.min_req === 'none' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>None</span>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.min_req === 'amount'} onChange={() => setDiscountForm(p => ({ ...p, min_req: 'amount' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.min_req === 'amount' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.min_req === 'amount' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div>
                                                <span className={`text-[12.5px] transition-colors ${discountForm.min_req === 'amount' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Minimum purchase amount ({currencySymbol})</span>
                                                {discountForm.min_req === 'amount' && (
                                                    <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 w-[160px]">
                                                        <input type="number" placeholder={`${currencySymbol} 0.00`} value={discountForm.min_amount} onChange={e => setDiscountForm(p => ({ ...p, min_amount: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="radio" className="hidden" checked={discountForm.min_req === 'qty'} onChange={() => setDiscountForm(p => ({ ...p, min_req: 'qty' }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.min_req === 'qty' ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.min_req === 'qty' && <div className="w-[5px] h-[5px] rounded-full bg-white"></div>}
                                            </div>
                                            <div>
                                                <span className={`text-[12.5px] transition-colors ${discountForm.min_req === 'qty' ? 'text-green-600 font-medium' : 'text-slate-700'}`}>Minimum quantity of items</span>
                                                {discountForm.min_req === 'qty' && (
                                                    <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 w-[120px]">
                                                        <input type="number" placeholder="0" value={discountForm.min_qty} onChange={e => setDiscountForm(p => ({ ...p, min_qty: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Usage limits */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Usage limits</p>
                                    <div className="flex flex-col gap-3">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" className="hidden" checked={discountForm.total_limit} onChange={e => setDiscountForm(p => ({ ...p, total_limit: e.target.checked }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.total_limit ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.total_limit && <Check size={10} color="white" strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <span className="text-[12.5px] text-slate-700">Limit number of times this discount can be used in total</span>
                                                {discountForm.total_limit && (
                                                    <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 w-[150px]">
                                                        <input type="number" placeholder="e.g. 100" value={discountForm.total_limit_val} onChange={e => setDiscountForm(p => ({ ...p, total_limit_val: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" className="hidden" checked={discountForm.per_customer} onChange={e => setDiscountForm(p => ({ ...p, per_customer: e.target.checked }))} />
                                            <div className={`mt-[1px] w-[15px] h-[15px] rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${discountForm.per_customer ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                                                {discountForm.per_customer && <Check size={10} color="white" strokeWidth={3} />}
                                            </div>
                                            <span className="text-[12.5px] text-slate-700">Limit to one use per customer</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Active dates */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Active dates</p>
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-[10px] items-center mb-2">
                                        <div className="relative">
                                            <input type="date" value={discountForm.startDate} onChange={e => setDiscountForm(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] text-slate-600 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all cursor-pointer" />
                                        </div>
                                        <span className="text-[12px] text-slate-400">to</span>
                                        <div className="relative">
                                            <input type="date" value={discountForm.endDate} onChange={e => setDiscountForm(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] text-slate-600 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition-all cursor-pointer" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-400">Leave end date empty for no expiry.</div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3.5">
                                {/* Summary */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-5">
                                    <p className="text-[13px] font-semibold text-slate-900 mb-3.5">Summary</p>
                                    
                                    {!discountForm.code && !discountForm.percentage && !discountForm.fixed_amount && !discountForm.startDate ? (
                                        <div className="text-[12px] text-slate-400">No information entered yet.</div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {discountForm.code && (
                                                <div className="flex items-start gap-1.5 text-[12px] text-slate-700">
                                                    <span className="text-green-600 text-[14px] leading-[1.2]">•</span>
                                                    <span>Code: <strong className="font-semibold text-slate-900">{discountForm.code}</strong></span>
                                                </div>
                                            )}
                                            {(discountForm.type === 'percentage' && discountForm.percentage > 0) || (discountForm.type === 'fixed' && discountForm.fixed_amount > 0) || discountForm.type === 'shipping' ? (
                                                <div className="flex items-start gap-1.5 text-[12px] text-slate-700">
                                                    <span className="text-green-600 text-[14px] leading-[1.2]">•</span>
                                                    <span>
                                                        {discountForm.type === 'percentage' && `${discountForm.percentage}% off`}
                                                        {discountForm.type === 'fixed' && `${currencySymbol}${discountForm.fixed_amount} off`}
                                                        {discountForm.type === 'shipping' && `Free shipping`}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div className="flex items-start gap-1.5 text-[12px] text-slate-700">
                                                <span className="text-green-600 text-[14px] leading-[1.2]">•</span>
                                                <span>
                                                    Applies to {discountForm.applies_to === 'entire' ? 'entire order' : discountForm.applies_to === 'collections' ? 'specific collections' : 'specific products'}
                                                </span>
                                            </div>
                                            {discountForm.startDate && (
                                                <div className="flex items-start gap-1.5 text-[12px] text-slate-700">
                                                    <span className="text-green-600 text-[14px] leading-[1.2]">•</span>
                                                    <span>
                                                        Active from {new Date(discountForm.startDate).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
                                                        {discountForm.endDate ? ` to ${new Date(discountForm.endDate).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Product Picker Modal */}
            {showProductPicker && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[17px] font-bold text-slate-800">Add Products</h3>
                            <button onClick={() => setShowProductPicker(false)} className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                <X size={16} />
                            </button>
                        </header>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Search products..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-medium" 
                                    value={pickerSearch}
                                    onChange={e => setPickerSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {products.filter(p => 
                                (p.name || '').toLowerCase().includes(pickerSearch.toLowerCase()) || 
                                (p.sku || '').toLowerCase().includes(pickerSearch.toLowerCase())
                            ).length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-sm">No products found matching your search.</div>
                            ) : (
                                products.filter(p => 
                                    (p.name || '').toLowerCase().includes(pickerSearch.toLowerCase()) || 
                                    (p.sku || '').toLowerCase().includes(pickerSearch.toLowerCase())
                                ).map(product => {
                                    const isSelected = collectionForm.productIds?.includes(product.id);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => {
                                                if (isSelected) {
                                                    setCollectionForm(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== product.id) }));
                                                } else {
                                                    setCollectionForm(prev => ({ ...prev, productIds: [...(prev.productIds || []), product.id] }));
                                                }
                                            }}
                                            className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-300" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[13px] font-semibold text-slate-800">{product.name}</p>
                                                <p className="text-[11.5px] text-slate-400">{currencySymbol}{parseFloat(product.price).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <footer className="p-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowProductPicker(false)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all">
                                Done
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* Dropdown Overlay Close */}
            {openDropdown && (
                <div className="fixed inset-0 z-[40]" onClick={() => setOpenDropdown(null)} />
            )}
        </div>
    );
}
