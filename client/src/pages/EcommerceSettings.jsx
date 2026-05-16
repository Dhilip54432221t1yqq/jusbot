import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { toast } from 'react-hot-toast';
import LottieLoader from '../components/LottieLoader';

const API_BASE = `${config.API_BASE}/ecommerce`;

const SETTINGS_STYLES = `
  .ecom-settings *, .ecom-settings *::before, .ecom-settings *::after { box-sizing: border-box; }

  .ecom-settings {
    --green: #22c55e;
    --green-dark: #16a34a;
    --green-bg: #f0fdf4;
    --card-bg: #ffffff;
    --border: #e5e7eb;
    --border-light: #f3f4f6;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --blue: #3b82f6;
    --blue-dark: #2563eb;
    --body-bg: #f8f9fa;
    --font: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    font-family: var(--font);
    font-size: 13px;
    color: var(--text-primary);
    flex: 1;
    overflow-y: auto;
    background: var(--body-bg);
  }

  .ecom-settings::-webkit-scrollbar { width: 5px; }
  .ecom-settings::-webkit-scrollbar-track { background: transparent; }
  .ecom-settings::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }

  .ecom-settings .section {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--body-bg);
  }
  .ecom-settings .section:last-child { border-bottom: none; }

  .ecom-settings .section-label {
    width: 260px;
    flex-shrink: 0;
    padding: 28px 24px;
  }
  .ecom-settings .section-label h3 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }
  .ecom-settings .section-label p {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .ecom-settings .section-content {
    flex: 1;
    padding: 20px 24px 20px 0;
    min-width: 0;
  }

  .ecom-settings .form-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
  }

  .ecom-settings .form-row { margin-bottom: 16px; }
  .ecom-settings .form-row:last-child { margin-bottom: 0; }

  .ecom-settings .form-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .ecom-settings label.field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 5px;
  }

  .ecom-settings input[type="text"],
  .ecom-settings input[type="email"],
  .ecom-settings input[type="tel"],
  .ecom-settings select,
  .ecom-settings textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 8px 11px;
    font-size: 13px;
    font-family: var(--font);
    color: var(--text-primary);
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .ecom-settings input[type="text"]:focus,
  .ecom-settings input[type="email"]:focus,
  .ecom-settings input[type="tel"]:focus,
  .ecom-settings select:focus,
  .ecom-settings textarea:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
  }

  .ecom-settings textarea {
    resize: vertical;
    min-height: 76px;
    line-height: 1.5;
  }

  .ecom-settings select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 11px center;
    padding-right: 30px;
    cursor: pointer;
  }

  .ecom-settings .char-count {
    font-size: 11px;
    color: var(--text-muted);
    text-align: right;
    margin-top: 4px;
  }

  .ecom-settings .checkbox-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
  }
  .ecom-settings .checkbox-row:last-child { margin-bottom: 0; }
  .ecom-settings .checkbox-row input[type="checkbox"],
  .ecom-settings .checkbox-row input[type="radio"] {
    width: 15px;
    height: 15px;
    accent-color: var(--green);
    cursor: pointer;
    flex-shrink: 0;
  }

  .ecom-settings .multiselect-wrap {
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    flex-wrap: wrap;
    min-height: 38px;
    cursor: text;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ecom-settings .multiselect-wrap:focus-within {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
  }

  .ecom-settings .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #f3f4f6;
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 3px 8px;
    font-size: 12px;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .ecom-settings .tag-x {
    cursor: pointer;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1;
    transition: color 0.1s;
  }
  .ecom-settings .tag-x:hover { color: #ef4444; }

  .ecom-settings .multiselect-wrap select {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
    background-image: none !important;
    appearance: auto;
    font-size: 13px;
    flex: 1;
    min-width: 80px;
    box-shadow: none !important;
    outline: none;
    color: var(--text-secondary);
    position: relative;
    z-index: 10;
  }
  .ecom-settings .multiselect-wrap select:focus { box-shadow: none !important; border: none !important; }

  .ecom-settings .counter {
    display: flex;
    align-items: center;
  }

  .ecom-settings .counter-btn {
    width: 34px;
    height: 36px;
    border: 1px solid var(--border);
    background: #f9fafb;
    font-size: 18px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background 0.1s;
    user-select: none;
    font-family: var(--font);
  }
  .ecom-settings .counter-btn:hover { background: #f3f4f6; }

  .ecom-settings .counter-input {
    width: 56px;
    border-radius: 0 !important;
    text-align: center;
    border-left: 1px solid var(--border) !important;
    border-right: 1px solid var(--border) !important;
  }

  .ecom-settings .counter-input-wide {
    width: 70px;
    border-radius: 0 !important;
    text-align: center;
    border-left: 1px solid var(--border) !important;
    border-right: 1px solid var(--border) !important;
  }

  .ecom-settings .order-id-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .ecom-settings .order-id-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .ecom-settings .order-preview {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 6px;
    margin-bottom: 16px;
  }

  .ecom-settings .save-btn {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: 9px 22px;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font);
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .ecom-settings .save-btn:hover { background: var(--blue-dark); }
  .ecom-settings .save-btn:active { transform: scale(0.98); }
`;

export default function EcommerceSettings({ onSave }) {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [storeName, setStoreName] = useState('');
    const [storeEmail, setStoreEmail] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeIndustry, setStoreIndustry] = useState('Services');

    const [bizName, setBizName] = useState('');
    const [address, setAddress] = useState('');
    const [country, setCountry] = useState('India');

    const [pickupChecked, setPickupChecked] = useState(false);
    const [deliveryChecked, setDeliveryChecked] = useState(false);
    const [deliveryArea, setDeliveryArea] = useState('all');
    const [deliveryFee, setDeliveryFee] = useState('0.00');
    const [postcodeInput, setPostcodeInput] = useState('');

    const [paymentTags, setPaymentTags] = useState([]);
    const [currency, setCurrency] = useState('INR - Indian Rupee');
    const [bankInfo, setBankInfo] = useState('');
    const [taxPercent, setTaxPercent] = useState(0);

    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');

    useEffect(() => {
        if (!workspaceId) return;
        authFetch(`${API_BASE}/settings?workspaceId=${workspaceId}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setStoreName(data.store_name || '');
                    setStoreEmail(data.store_email || '');
                    setStorePhone(data.store_phone || '');
                    setStoreIndustry(data.store_industry || 'Services');
                    setBizName(data.biz_name || '');
                    setAddress(data.address || '');
                    setCountry(data.country || 'India');
                    setPickupChecked(data.pickup_checked || false);
                    setDeliveryChecked(data.delivery_checked || false);
                    setDeliveryArea(data.delivery_area || 'all');
                    setDeliveryFee(data.delivery_fee ? parseFloat(data.delivery_fee).toFixed(2) : '0.00');
                    setPostcodeInput(data.postcode_input || '');
                    setPaymentTags(data.payment_tags || []);
                    setCurrency(data.currency || 'INR - Indian Rupee');
                    setBankInfo(data.bank_info || '');
                    setTaxPercent(data.tax_percent || 0);
                    setPrefix(data.order_prefix || '');
                    setSuffix(data.order_suffix || '');
                }
            })
            .catch(err => console.error('Failed to load settings:', err))
            .finally(() => setLoading(false));
    }, [workspaceId]);

    const handleSave = async () => {
        const payload = {
            store_name: storeName,
            store_email: storeEmail,
            store_phone: storePhone,
            store_industry: storeIndustry,
            biz_name: bizName,
            address,
            country,
            pickup_checked: pickupChecked,
            delivery_checked: deliveryChecked,
            delivery_area: deliveryArea,
            delivery_fee: parseFloat(deliveryFee) || 0,
            postcode_input: postcodeInput,
            payment_tags: paymentTags,
            currency,
            bank_info: bankInfo,
            tax_percent: taxPercent,
            order_prefix: prefix,
            order_suffix: suffix
        };
        try {
            const res = await authFetch(`${API_BASE}/settings?workspaceId=${workspaceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success('Settings saved successfully');
                if (onSave) onSave();
            }
            else toast.error('Failed to save settings');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings');
        }
    };

    const stepFee = useCallback((dir) => {
        setDeliveryFee(prev => {
            const val = Math.max(0, parseFloat(prev) + dir);
            return val.toFixed(2);
        });
    }, []);

    const stepTax = useCallback((dir) => {
        setTaxPercent(prev => Math.max(0, prev + dir));
    }, []);

    const removeTag = useCallback((index) => {
        setPaymentTags(prev => prev.filter((_, i) => i !== index));
    }, []);

    const addPaymentMethod = useCallback((e) => {
        const val = e.target.value;
        if (val && !paymentTags.includes(val)) {
            setPaymentTags(prev => [...prev, val]);
        }
        e.target.value = '';
    }, [paymentTags]);

    const orderPreview = `Your order ID will appear as ${prefix}1001${suffix}, ${prefix}1002${suffix}, ${prefix}1003${suffix} ...`;

    return (
        <>
            <style>{SETTINGS_STYLES}</style>
            <div className="ecom-settings">
                {loading ? (
                    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><LottieLoader size={120} message="Loading settings..." /></div>
                ) : (
                    <>
                {/* 1. Store Details */}
                <div className="section">
                    <div className="section-label">
                        <h3>Store details</h3>
                        <p>Your store customers will use this information to contact you.</p>
                    </div>
                    <div className="section-content">
                        <div className="form-card">
                            <div className="form-row">
                                <label className="field-label">Store name</label>
                                <input type="text" value={storeName} maxLength={100} onChange={e => setStoreName(e.target.value)} />
                                <div className="char-count">{storeName.length}/100</div>
                            </div>
                            <div className="form-cols">
                                <div>
                                    <label className="field-label">Store contact email</label>
                                    <input type="text" value={storeEmail} maxLength={500} onChange={e => setStoreEmail(e.target.value)} />
                                    <div className="char-count">{storeEmail.length}/500</div>
                                </div>
                                <div>
                                    <label className="field-label">Store contact phone</label>
                                    <input type="text" value={storePhone} maxLength={100} onChange={e => setStorePhone(e.target.value)} />
                                    <div className="char-count">{storePhone.length}/100</div>
                                </div>
                            </div>
                            <div className="form-row" style={{ marginBottom: 0 }}>
                                <label className="field-label">Store industry</label>
                                <select value={storeIndustry} onChange={e => setStoreIndustry(e.target.value)}>
                                    <option>Beauty</option>
                                    <option>Clothing</option>
                                    <option>Electronics</option>
                                    <option>Furniture</option>
                                    <option>Groceries</option>
                                    <option>Handcrafts</option>
                                    <option>Jewelry</option>
                                    <option>Other</option>
                                    <option>Other food &amp; drink</option>
                                    <option>Painting</option>
                                    <option>Photography</option>
                                    <option>Restaurants</option>
                                    <option>Services</option>
                                    <option>Sports</option>
                                    <option>Toys</option>
                                    <option>Virtual services</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Store Address */}
                <div className="section">
                    <div className="section-label">
                        <h3>Store address</h3>
                        <p>This address will appear on customers invoices.</p>
                    </div>
                    <div className="section-content">
                        <div className="form-card">
                            <div className="form-row">
                                <label className="field-label">Legal name of business</label>
                                <input type="text" value={bizName} maxLength={100} onChange={e => setBizName(e.target.value)} />
                                <div className="char-count">{bizName.length}/100</div>
                            </div>
                            <div className="form-row">
                                <label className="field-label">Address</label>
                                <textarea maxLength={500} value={address} onChange={e => setAddress(e.target.value)} placeholder="" />
                                <div className="char-count">{address.length}/500</div>
                            </div>
                            <div className="form-row" style={{ marginBottom: 0 }}>
                                <label className="field-label">Country</label>
                                <select value={country} onChange={e => setCountry(e.target.value)}>
                                    <option>India</option>
                                    <option>United States</option>
                                    <option>United Kingdom</option>
                                    <option>Singapore</option>
                                    <option>Australia</option>
                                    <option>Canada</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Shipping Method */}
                <div className="section">
                    <div className="section-label">
                        <h3>Shipping method</h3>
                        <p>The shipping method for the customer to choose from. The store address will be used as the pick up address.</p>
                    </div>
                    <div className="section-content">
                        <div className="form-card">
                            <label className="checkbox-row">
                                <input type="checkbox" checked={pickupChecked} onChange={e => setPickupChecked(e.target.checked)} /> Pick up from store address
                            </label>
                            <label className="checkbox-row" style={{ color: 'var(--green)', fontWeight: 500 }}>
                                <input type="checkbox" checked={deliveryChecked} onChange={e => setDeliveryChecked(e.target.checked)} /> Delivery
                            </label>

                            {deliveryChecked && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>Delivery area</div>
                                            <label className="checkbox-row" style={{ fontWeight: 400, color: 'var(--text-primary)' }}>
                                                <input type="radio" name="delivery-area" value="all" checked={deliveryArea === 'all'} onChange={() => setDeliveryArea('all')} style={{ accentColor: 'var(--green)' }} /> All suburbs
                                            </label>
                                            <label className="checkbox-row" style={{ fontWeight: 400, color: 'var(--green)' }}>
                                                <input type="radio" name="delivery-area" value="limited" checked={deliveryArea === 'limited'} onChange={() => setDeliveryArea('limited')} style={{ accentColor: 'var(--green)' }} /> Limited suburbs
                                            </label>
                                            {deliveryArea === 'limited' && (
                                                <div style={{ marginTop: 10 }}>
                                                    <input type="text" value={postcodeInput} onChange={e => setPostcodeInput(e.target.value)} placeholder="Please enter a postcode" style={{ border: '1.5px solid var(--green)', borderRadius: 6, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font)' }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ minWidth: 180, textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>Delivery fee</div>
                                            <div className="counter" style={{ justifyContent: 'flex-end' }}>
                                                <button className="counter-btn" style={{ borderRadius: '7px 0 0 7px', borderRight: 'none' }} onClick={() => stepFee(-1)}>−</button>
                                                <input type="text" className="counter-input-wide" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                                                <button className="counter-btn" style={{ borderRadius: '0 7px 7px 0', borderLeft: 'none' }} onClick={() => stepFee(1)}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Payment Method */}
                <div className="section">
                    <div className="section-label">
                        <h3>Payment method</h3>
                        <p>The payment methods that are enabled in the checkout page.</p>
                    </div>
                    <div className="section-content">
                        <div className="form-card">
                            <div className="form-row">
                                <label className="field-label">Payment method</label>
                                <div className="multiselect-wrap">
                                    {paymentTags.map((tag, i) => (
                                        <span className="tag" key={i}>
                                            {tag} <span className="tag-x" onClick={() => removeTag(i)}>×</span>
                                        </span>
                                    ))}
                                    <select onChange={addPaymentMethod} defaultValue="" style={{ border: 'none', padding: 0, background: 'transparent', flex: 1, minWidth: 80, boxShadow: 'none' }}>
                                        <option value="">Add method...</option>
                                        <option>Cash on Delivery</option>
                                        <option>Bank Transfer</option>
                                        <option>PayPal</option>
                                        <option>UPI</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <label className="field-label">Currency</label>
                                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                                    <option>INR - Indian Rupee</option>
                                    <option>USD - US Dollar</option>
                                    <option>EUR - Euro</option>
                                    <option>GBP - British Pound</option>
                                    <option>SGD - Singapore Dollar</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label className="field-label">Bank Information</label>
                                <textarea maxLength={500} value={bankInfo} onChange={e => setBankInfo(e.target.value)} />
                                <div className="char-count">{bankInfo.length}/500</div>
                            </div>
                            <div className="form-row" style={{ marginBottom: 0 }}>
                                <label className="field-label">Tax Percentage (%)</label>
                                <div className="counter">
                                    <button className="counter-btn" style={{ borderRadius: '7px 0 0 7px', borderRight: 'none' }} onClick={() => stepTax(-1)}>−</button>
                                    <input type="text" className="counter-input" value={taxPercent} onChange={e => setTaxPercent(parseInt(e.target.value) || 0)} />
                                    <button className="counter-btn" style={{ borderRadius: '0 7px 7px 0', borderLeft: 'none' }} onClick={() => stepTax(1)}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Standards and Formats */}
                <div className="section">
                    <div className="section-label">
                        <h3>Standards and formats</h3>
                        <p>Standards and formats are used to generate the order id format.</p>
                    </div>
                    <div className="section-content">
                        <div className="form-card">
                            <div style={{ marginBottom: 12 }}>
                                <div className="order-id-title">Edit Order ID Format (Optional)</div>
                                <div className="order-id-desc">Order numbers will be an auto generated number. While you can't change the order number itself, you can add a prefix or suffix to create IDs like "EN1001" or "1001-A".</div>
                            </div>
                            <div className="form-cols" style={{ marginBottom: 0 }}>
                                <div>
                                    <label className="field-label">Prefix</label>
                                    <input type="text" value={prefix} maxLength={20} onChange={e => setPrefix(e.target.value)} />
                                    <div className="char-count">{prefix.length}/20</div>
                                </div>
                                <div>
                                    <label className="field-label">Suffix</label>
                                    <input type="text" value={suffix} maxLength={20} onChange={e => setSuffix(e.target.value)} />
                                    <div className="char-count">{suffix.length}/20</div>
                                </div>
                            </div>
                            <div className="order-preview">{orderPreview}</div>
                            <button className="save-btn" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>

                    </>
                )}
            </div>
        </>
    );
}
