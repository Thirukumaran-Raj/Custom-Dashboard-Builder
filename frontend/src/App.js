import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import api from './api';
import OrderForm      from './components/OrderForm';
import OrderTable     from './components/OrderTable';
import DashboardPage  from './components/DashboardPage';
import ConfigurePage  from './components/ConfigurePage';
import './App.css';

function AppContent() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState(null);
  const [editing,       setEditing]       = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [savedWidgets,  setSavedWidgets]  = useState([]);
  const [allLayouts,    setAllLayouts]    = useState([]);
  const [activeLayout,  setActiveLayout]  = useState(null);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch dashboard ── */
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/dashboard`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSavedWidgets(data);
          return;
        }
      }
    } catch {}
    try {
      const local = JSON.parse(localStorage.getItem('hal_widgets') || '[]');
      setSavedWidgets(local);
    } catch {}
  }, []);

  /* ── Fetch all saved layouts ── */
  const fetchLayouts = useCallback(() => {
    try {
      const layouts = JSON.parse(localStorage.getItem('hal_layouts') || '[]');
      setAllLayouts(layouts);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDashboard();
    fetchLayouts();
  }, [fetchOrders, fetchDashboard, fetchLayouts]);

  const openCreate = useCallback(() => { setEditing(null);  setModalOpen(true); }, []);
  const openEdit   = useCallback(o  => { setEditing(o);     setModalOpen(true); }, []);
  const closeModal = useCallback(()  => { setModalOpen(false); setEditing(null); }, []);

  const handleSave = useCallback(async payload => {
    setSaving(true); setError(null);
    try {
      if (editing) { await api.put('/orders/'+editing._id, payload); }
      else         { await api.post('/orders', payload); }
      closeModal(); await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Save failed');
    } finally { setSaving(false); }
  }, [editing, fetchOrders, closeModal]);

  const handleDelete = useCallback(async order => {
    const ok = window.confirm(`Are you sure you want to delete the order for ${order.customer.firstName} ${order.customer.lastName}? This action cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try { await api.delete('/orders/'+order._id); await fetchOrders(); }
    catch (err) { setError(err.response?.data?.error || err.message || 'Delete failed'); }
    finally { setSaving(false); }
  }, [fetchOrders]);

  /* ── Persist widgets ── */
  const persistWidgets = useCallback(async (widgets) => {
    setSavedWidgets(widgets);
    try { localStorage.setItem('hal_widgets', JSON.stringify(widgets)); } catch {}
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets }),
      });
    } catch {}
  }, []);

  const handleSaveWidgets  = useCallback(w => persistWidgets(w), [persistWidgets]);
  const handleDeleteWidget = useCallback(id => persistWidgets(savedWidgets.filter(w => w.id !== id)), [savedWidgets, persistWidgets]);
  const handleUpdateWidget = useCallback(updated => persistWidgets(savedWidgets.map(w => w.id === updated.id ? updated : w)), [savedWidgets, persistWidgets]);

  /* ── Save named layout ── */
  const handleSaveLayout = useCallback((name) => {
    const id  = Date.now();
    const layout = { id, name, widgets: savedWidgets, createdAt: new Date().toISOString() };
    const next = [...allLayouts, layout];
    setAllLayouts(next);
    setActiveLayout(id);
    try { localStorage.setItem('hal_layouts', JSON.stringify(next)); } catch {}
  }, [savedWidgets, allLayouts]);

  /* ── Switch layout ── */
  const handleSwitchLayout = useCallback((layoutId) => {
    const layout = allLayouts.find(l => l.id === Number(layoutId));
    if (layout) {
      setActiveLayout(layout.id);
      persistWidgets(layout.widgets);
    }
  }, [allLayouts, persistWidgets]);

  /* ── Delete layout ── */
  const handleDeleteLayout = useCallback((layoutId) => {
    const next = allLayouts.filter(l => l.id !== layoutId);
    setAllLayouts(next);
    try { localStorage.setItem('hal_layouts', JSON.stringify(next)); } catch {}
  }, [allLayouts]);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Custom Dashboard Builder</h1>
          <p className="subtitle">Manage customer orders and explore your data in real time.</p>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={
            <>
              <section className="panel">
                <DashboardPage
                  orders={orders}
                  savedWidgets={savedWidgets}
                  loading={loading}
                  onDeleteWidget={handleDeleteWidget}
                  onUpdateWidget={handleUpdateWidget}
                  onFetchOrders={fetchOrders}
                  allLayouts={allLayouts}
                  activeLayout={activeLayout}
                  onSwitchLayout={handleSwitchLayout}
                  onSaveLayout={handleSaveLayout}
                  onDeleteLayout={handleDeleteLayout}
                />
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Customer Orders</h2>
                    <span className="muted">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button type="button" className="btn primary" onClick={openCreate}>+ Create Order</button>
                </div>
                <OrderTable orders={orders} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
              </section>
            </>
          } />
          <Route path="/configure" element={
            <ConfigurePage onSave={handleSaveWidgets} savedWidgets={savedWidgets} />
          } />
        </Routes>
        {error && <div className="toast error" onClick={() => setError(null)}>{error}</div>}
      </main>

      <footer className="footer"><span>Powered by MERN</span></footer>

      <OrderForm open={modalOpen} onSubmit={handleSave} loading={saving} initialValues={editing} onCancel={closeModal} />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
