import { useState, useEffect, useRef, useCallback } from 'react';

export default function OrderTable({ orders, onEdit, onDelete, loading }) {
  const [menu, setMenu] = useState(null); // { orderId, x, y }

  /* close menu on outside click or scroll */
  useEffect(() => {
    const close = () => setMenu(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, []);

  const openMenu = useCallback((order, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({
      order,
      x: rect.right,
      y: rect.bottom + 4,
    });
  }, []);

  const handleEdit = useCallback(() => {
    if (!menu) return;
    onEdit(menu.order);
    setMenu(null);
  }, [menu, onEdit]);

  const handleDelete = useCallback(() => {
    if (!menu) return;
    onDelete(menu.order);
    setMenu(null);
  }, [menu, onDelete]);

  const shortId    = (id) => id ? String(id).slice(-6).toUpperCase() : '—';
  const formatDate = (d)  => d  ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const formatAddr = (a)  => a  ? [a.street, a.city, a.state, a.country].filter(Boolean).join(', ') : '—';

  const statusClass = (s) => {
    if (s === 'Pending')     return 'status pending';
    if (s === 'In progress') return 'status in-progress';
    if (s === 'Completed')   return 'status completed';
    return 'status';
  };

  return (
    <>
      <div className="ot-wrap">
        <div className="ot-scroll">
          <table className="ot-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer name</th>
                <th>Email id</th>
                <th>Phone number</th>
                <th>Address</th>
                <th>Order ID</th>
                <th>Order date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Total amount</th>
                <th>Status</th>
                <th>Created by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" className="ot-center">Loading…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="14" className="ot-center">
                    No orders yet. Click <strong>+ Create Order</strong> to get started.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const total = (order.quantity || 0) * (order.unitPrice || 0);
                  const isOpen = menu?.order?._id === order._id;
                  return (
                    <tr key={order._id}>
                      <td className="ot-mono">{shortId(order._id)}</td>
                      <td className="ot-nowrap">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </td>
                      <td>{order.customer?.email}</td>
                      <td className="ot-nowrap">{order.customer?.phone}</td>
                      <td className="ot-addr">{formatAddr(order.address)}</td>
                      <td className="ot-mono">{shortId(order._id)}</td>
                      <td className="ot-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="ot-nowrap">{order.product}</td>
                      <td>{order.quantity}</td>
                      <td className="ot-nowrap">${order.unitPrice?.toFixed(2)}</td>
                      <td className="ot-nowrap">${total.toFixed(2)}</td>
                      <td>
                        <span className={statusClass(order.status)}>{order.status}</span>
                      </td>
                      <td className="ot-nowrap">{order.createdBy}</td>
                      <td className="ot-action-cell">
                        <button
                          type="button"
                          className={`ot-ctx-btn${isOpen ? ' active' : ''}`}
                          onClick={(e) => openMenu(order, e)}
                          aria-label="Row actions"
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context menu — rendered at root level via fixed positioning */}
      {menu && (
        <div
          className="ot-ctx-menu"
          style={{
            top:   menu.y,
            right: `calc(100vw - ${menu.x}px)`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={handleEdit}>Edit</button>
          <button type="button" className="danger" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </>
  );
}