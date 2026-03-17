import { useEffect, useState, useCallback } from 'react';

const DEFAULT_ORDER = {
  customer: {
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     ''
  },
  address: {
    street:     '',
    city:       '',
    state:      '',
    postalCode: '',
    country:    'United States'
  },
  product:   'Fiber Internet 300 Mbps',
  quantity:  1,
  unitPrice: 49.99,
  status:    'Pending',
  createdBy: 'Mr. Michael Harris'
};

const productOptions = [
  'Fiber Internet 300 Mbps',
  '5G Unlimited Mobile Plan',
  'Fiber Internet 1 Gbps',
  'Business Internet 500 Mbps',
  'VoIP Corporate Package',
];

const statusOptions  = ['Pending', 'In progress', 'Completed'];
const userOptions    = ['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin'];
const countryOptions = ['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong'];

const REQUIRED_FIELDS = [
  { path: 'customer.firstName', label: 'First name' },
  { path: 'customer.lastName',  label: 'Last name' },
  { path: 'customer.email',     label: 'Email id' },
  { path: 'customer.phone',     label: 'Phone number' },
  { path: 'address.street',     label: 'Street Address' },
  { path: 'address.city',       label: 'City' },
  { path: 'address.state',      label: 'State / Province' },
  { path: 'address.postalCode', label: 'Postal code' },
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj);
}

export default function OrderForm({ onSubmit, loading, initialValues, onCancel, open }) {
  const [form,   setForm]   = useState(DEFAULT_ORDER);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(initialValues ? { ...DEFAULT_ORDER, ...initialValues } : DEFAULT_ORDER);
    }
  }, [open, initialValues]);

  const handleField = useCallback((path, value) => {
    const keys = path.split('.');
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
    /* clear error for this field on change */
    setErrors(prev => { const n = { ...prev }; delete n[path]; return n; });
  }, []);

  /* FIX 2: enforce quantity cannot go below 1 */
  const handleQuantity = useCallback((raw) => {
    const val = Math.max(1, Number(raw) || 1);
    handleField('quantity', val);
  }, [handleField]);

  const validate = () => {
    const next = {};
    REQUIRED_FIELDS.forEach(({ path }) => {
      const val = getNestedValue(form, path);
      if (!val || !String(val).trim()) next[path] = 'Please fill the field';
    });
    if (!form.quantity || form.quantity < 1) next.quantity  = 'Please fill the field';
    if (form.unitPrice == null || form.unitPrice < 0) next.unitPrice = 'Please fill the field';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const total = (form.quantity || 0) * (form.unitPrice || 0);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel?.()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{initialValues ? 'Edit Order' : 'Create Order'}</h2>
          <button type="button" className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form className="order-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">

            {/* Customer Information */}
            <div className="form-section">
              <h3>Customer Information</h3>

              <label>First name <span className="req">*</span>
                <input type="text" value={form.customer.firstName}
                  onChange={e => handleField('customer.firstName', e.target.value)}
                  placeholder="First name" />
                {errors['customer.firstName'] && <span className="field-error">{errors['customer.firstName']}</span>}
              </label>

              <label>Last name <span className="req">*</span>
                <input type="text" value={form.customer.lastName}
                  onChange={e => handleField('customer.lastName', e.target.value)}
                  placeholder="Last name" />
                {errors['customer.lastName'] && <span className="field-error">{errors['customer.lastName']}</span>}
              </label>

              <label>Email id <span className="req">*</span>
                <input type="text" value={form.customer.email}
                  onChange={e => handleField('customer.email', e.target.value)}
                  placeholder="Email id" />
                {errors['customer.email'] && <span className="field-error">{errors['customer.email']}</span>}
              </label>

              <label>Phone number <span className="req">*</span>
                <input type="text" value={form.customer.phone}
                  onChange={e => handleField('customer.phone', e.target.value)}
                  placeholder="Phone number" />
                {errors['customer.phone'] && <span className="field-error">{errors['customer.phone']}</span>}
              </label>

              <label>Street Address <span className="req">*</span>
                <input type="text" value={form.address.street}
                  onChange={e => handleField('address.street', e.target.value)}
                  placeholder="Street address" />
                {errors['address.street'] && <span className="field-error">{errors['address.street']}</span>}
              </label>

              <label>City <span className="req">*</span>
                <input type="text" value={form.address.city}
                  onChange={e => handleField('address.city', e.target.value)}
                  placeholder="City" />
                {errors['address.city'] && <span className="field-error">{errors['address.city']}</span>}
              </label>

              <label>State / Province <span className="req">*</span>
                <input type="text" value={form.address.state}
                  onChange={e => handleField('address.state', e.target.value)}
                  placeholder="State / Province" />
                {errors['address.state'] && <span className="field-error">{errors['address.state']}</span>}
              </label>

              <label>Postal code <span className="req">*</span>
                <input type="text" value={form.address.postalCode}
                  onChange={e => handleField('address.postalCode', e.target.value)}
                  placeholder="Postal code" />
                {errors['address.postalCode'] && <span className="field-error">{errors['address.postalCode']}</span>}
              </label>

              <label>Country <span className="req">*</span>
                <select value={form.address.country}
                  onChange={e => handleField('address.country', e.target.value)}>
                  {countryOptions.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>

            {/* Order Information */}
            <div className="form-section">
              <h3>Order Information</h3>

              <label>Choose product <span className="req">*</span>
                <select value={form.product}
                  onChange={e => handleField('product', e.target.value)}>
                  {productOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>

              <label>Quantity <span className="req">*</span>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => handleQuantity(e.target.value)}
                  onBlur={e => {
                    /* enforce min on blur in case user clears the field */
                    if (!e.target.value || Number(e.target.value) < 1) {
                      handleField('quantity', 1);
                    }
                  }}
                />
                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
              </label>

              <label>Unit price <span className="req">*</span>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">$</span>
                  <input type="number" min="0" step="0.01" value={form.unitPrice}
                    onChange={e => handleField('unitPrice', Number(e.target.value))}
                    className="has-prefix" />
                </div>
                {errors.unitPrice && <span className="field-error">{errors.unitPrice}</span>}
              </label>

              <label>Total amount
                <div className="input-prefix-wrap">
                  <span className="input-prefix">$</span>
                  <input value={total.toFixed(2)} readOnly className="has-prefix" />
                </div>
              </label>

              <label>Status <span className="req">*</span>
                <select value={form.status}
                  onChange={e => handleField('status', e.target.value)}>
                  {statusOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>

              <label>Created by <span className="req">*</span>
                <select value={form.createdBy}
                  onChange={e => handleField('createdBy', e.target.value)}>
                  {userOptions.map(u => <option key={u}>{u}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onCancel} disabled={loading}>Cancel</button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}