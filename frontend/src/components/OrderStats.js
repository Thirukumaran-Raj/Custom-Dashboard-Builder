import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#059669', '#f59e0b', '#ef4444', '#0ea5e9'];

export default function OrderStats({ orders }) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.quantity * order.unitPrice, 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

  const statusMap = orders.reduce((acc, order) => {
    const key = order.status || 'Pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusMap).map(([status, value]) => ({ name: status, value }));

  const productMap = orders.reduce((acc, order) => {
    acc[order.product] = (acc[order.product] || 0) + order.quantity;
    return acc;
  }, {});

  const productData = Object.entries(productMap).map(([product, value]) => ({ product, value }));

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Total orders</div>
        <div className="stat-value">{totalOrders}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total revenue</div>
        <div className="stat-value">${totalRevenue.toFixed(2)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Average order</div>
        <div className="stat-value">${avgOrder.toFixed(2)}</div>
      </div>

      <div className="chart-card">
        <h3>Status breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Quantity by product</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={productData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="product" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
