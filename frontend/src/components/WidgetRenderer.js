import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#a855f7','#14b8a6','#f97316'];
const TOOLTIP_STYLE = { background:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#f2f5ff' };
const AXIS_TICK  = { fill:'#8b8fa8', fontSize:11 };
const GRID_STROKE = 'rgba(255,255,255,0.06)';

function shortId(id) { return id ? String(id).slice(-6).toUpperCase() : '—'; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }

function getFieldValue(order, field) {
  switch(field) {
    case 'customerId':   return shortId(order._id);
    case 'customerName': return `${order.customer?.firstName||''} ${order.customer?.lastName||''}`.trim();
    case 'email':        return order.customer?.email||'';
    case 'phone':        return order.customer?.phone||'';
    case 'address':      return [order.address?.street,order.address?.city,order.address?.state,order.address?.country].filter(Boolean).join(', ');
    case 'orderId':      return shortId(order._id);
    case 'orderDate':    return formatDate(order.createdAt);
    case 'product':      return order.product||'';
    case 'quantity':     return order.quantity??'';
    case 'unitPrice':    return order.unitPrice!=null?`$${order.unitPrice.toFixed(2)}`:'';
    case 'totalAmount':  return order.unitPrice!=null&&order.quantity!=null?`$${(order.unitPrice*order.quantity).toFixed(2)}`:'';
    case 'status':       return order.status||'';
    case 'createdBy':    return order.createdBy||'';
    default:             return '';
  }
}

function getNumericValue(order, field) {
  switch(field) {
    case 'quantity':    return Number(order.quantity)||0;
    case 'unitPrice':   return Number(order.unitPrice)||0;
    case 'totalAmount': return (Number(order.quantity)||0)*(Number(order.unitPrice)||0);
    default:            return 0;
  }
}

function getStringKey(order, field) {
  switch(field) {
    case 'product':     return order.product||'Unknown';
    case 'status':      return order.status||'Unknown';
    case 'createdBy':   return order.createdBy||'Unknown';
    case 'quantity':    return String(order.quantity??0);
    case 'unitPrice':   return `$${Number(order.unitPrice||0).toFixed(2)}`;
    case 'totalAmount': return `$${((Number(order.quantity)||0)*(Number(order.unitPrice)||0)).toFixed(2)}`;
    default:            return String(order[field]||'');
  }
}

function buildChartData(orders, xField, yField) {
  const map = {};
  orders.forEach(order => {
    const key = getStringKey(order, xField);
    if (!map[key]) map[key] = { name: key, value: 0 };
    map[key].value += getNumericValue(order, yField);
  });
  return Object.values(map);
}

function groupByField(orders, field) {
  const map = {};
  orders.forEach(order => {
    const key = getStringKey(order, field);
    if (!map[key]) map[key] = { name: key, value: 0 };
    map[key].value += 1;
  });
  return Object.values(map);
}

function computeKPI(orders, metric, aggregation) {
  if (aggregation === 'count') return orders.length;
  const numeric = ['totalAmount','unitPrice','quantity'];
  if (!numeric.includes(metric)) return orders.length;
  const vals = orders.map(o => getNumericValue(o, metric));
  if (aggregation === 'sum') return vals.reduce((a,b)=>a+b,0);
  if (aggregation === 'average') return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  return 0;
}

function applyFilters(orders, filters) {
  if (!filters||!filters.length) return orders;
  return orders.filter(order => filters.every(f => {
    const raw  = String(getFieldValue(order,f.field)).toLowerCase();
    const fval = String(f.value).toLowerCase();
    switch(f.operator) {
      case 'equals':   return raw === fval;
      case 'contains': return raw.includes(fval);
      case 'gt':       return parseFloat(raw) > parseFloat(f.value);
      case 'lt':       return parseFloat(raw) < parseFloat(f.value);
      default:         return true;
    }
  }));
}

function Empty({ msg='No data available' }) {
  return <div className="widget-empty"><span>{msg}</span></div>;
}

export default function WidgetRenderer({ widget, orders }) {
  const { type, config } = widget;
  if (!orders||orders.length===0) return <Empty msg="No orders in selected range" />;
  switch(type) {
    case 'bar-chart':    return <BarW    orders={orders} config={config}/>;
    case 'line-chart':   return <LineW   orders={orders} config={config}/>;
    case 'area-chart':   return <AreaW   orders={orders} config={config}/>;
    case 'scatter-plot': return <ScatterW orders={orders} config={config}/>;
    case 'pie-chart':    return <PieW    orders={orders} config={config}/>;
    case 'kpi':          return <KPIW    orders={orders} config={config}/>;
    case 'table':        return <TableW  orders={orders} config={config}/>;
    default:             return <Empty msg="Unknown widget type"/>;
  }
}

/* ── KPI ── */
function KPIW({ orders, config }) {
  const raw  = computeKPI(orders, config.metric||'totalAmount', config.aggregation||'sum');
  const prec = config.decimalPrecision??0;
  const display = config.dataFormat==='currency' ? `$${raw.toFixed(prec)}` : Number(raw.toFixed(prec)).toLocaleString();
  const MLABELS = { totalAmount:'Total amount', unitPrice:'Unit price', quantity:'Quantity', customerName:'Customers', product:'Products', status:'Status', createdBy:'Created by', orderId:'Orders' };
  const ALABELS = { sum:'Sum', average:'Average', count:'Count' };
  return (
    <div className="wgt-kpi">
      <div className="wgt-kpi-value">{display}</div>
      <div className="wgt-kpi-meta">
        <span className="wgt-kpi-agg">{ALABELS[config.aggregation]||''}</span>
        <span className="wgt-kpi-field">{MLABELS[config.metric]||config.metric}</span>
      </div>
    </div>
  );
}

/* ── Bar Chart ── */
function BarW({ orders, config }) {
  const data  = buildChartData(orders, config.xAxis||'product', config.yAxis||'quantity');
  const color = config.chartColor||'#6366f1';
  if (!data.length) return <Empty/>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{top:8,right:16,left:-10,bottom:52}}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-35} textAnchor="end" interval={0}/>
        <YAxis tick={AXIS_TICK}/>
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill:'rgba(255,255,255,0.04)'}}/>
        <Bar dataKey="value" fill={color} radius={[4,4,0,0]} maxBarSize={52}>
          {config.showDataLabel && <LabelList dataKey="value" position="top" style={{fill:'#f2f5ff',fontSize:11}}/>}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Line Chart ── */
function LineW({ orders, config }) {
  const data  = buildChartData(orders, config.xAxis||'product', config.yAxis||'quantity');
  const color = config.chartColor||'#6366f1';
  if (!data.length) return <Empty/>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{top:8,right:16,left:-10,bottom:52}}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-35} textAnchor="end" interval={0}/>
        <YAxis tick={AXIS_TICK}/>
        <Tooltip contentStyle={TOOLTIP_STYLE}/>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{r:4,fill:color,strokeWidth:0}} activeDot={{r:6}}>
          {config.showDataLabel && <LabelList dataKey="value" position="top" style={{fill:'#f2f5ff',fontSize:11}}/>}
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Area Chart ── */
function AreaW({ orders, config }) {
  const data  = buildChartData(orders, config.xAxis||'product', config.yAxis||'quantity');
  const color = config.chartColor||'#6366f1';
  const gid   = `ag${color.replace('#','')}`;
  if (!data.length) return <Empty/>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{top:8,right:16,left:-10,bottom:52}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false}/>
        <XAxis dataKey="name" tick={AXIS_TICK} angle={-35} textAnchor="end" interval={0}/>
        <YAxis tick={AXIS_TICK}/>
        <Tooltip contentStyle={TOOLTIP_STYLE}/>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gid})`}>
          {config.showDataLabel && <LabelList dataKey="value" position="top" style={{fill:'#f2f5ff',fontSize:11}}/>}
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Scatter Plot ── */
function ScatterW({ orders, config }) {
  const color  = config.chartColor||'#6366f1';
  const xField = config.xAxis||'quantity';
  const yField = config.yAxis||'totalAmount';
  const data   = orders.map(o=>({ x:getNumericValue(o,xField), y:getNumericValue(o,yField) }));
  if (!data.length) return <Empty/>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{top:8,right:16,left:-10,bottom:8}}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE}/>
        <XAxis dataKey="x" name={xField} tick={AXIS_TICK}/>
        <YAxis dataKey="y" name={yField} tick={AXIS_TICK}/>
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{strokeDasharray:'3 3'}}/>
        <Scatter data={data} fill={color} opacity={0.8}/>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Pie Chart ── */
function PieW({ orders, config }) {
  const data = groupByField(orders, config.chartData||'product');
  if (!data.length) return <Empty/>;
  const R = Math.PI/180;
  const renderLabel = ({ cx,cy,midAngle,innerRadius,outerRadius,percent,name }) => {
    if (percent<0.05) return null;
    const r = innerRadius+(outerRadius-innerRadius)*0.5;
    const x = cx+r*Math.cos(-midAngle*R);
    const y = cy+r*Math.sin(-midAngle*R);
    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent*100).toFixed(0)}%`}</text>;
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="65%" labelLine={false} label={renderLabel}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[v,n]}/>
        {config.showLegend && <Legend wrapperStyle={{fontSize:12,color:'#8b8fa8',paddingTop:8}} iconType="circle" iconSize={8}/>}
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Table Widget ── */
function TableW({ orders, config }) {
  const cols     = config.columns?.length ? config.columns : ['customerName','product','status'];
  const fontSize = config.fontSize||14;
  const headerBg = config.headerBg||'#54bd95';
  const pageSize = config.pagination||10;
  const CLABELS  = { customerId:'Customer ID', customerName:'Customer name', email:'Email id', phone:'Phone number', address:'Address', orderId:'Order ID', orderDate:'Order date', product:'Product', quantity:'Qty', unitPrice:'Unit price', totalAmount:'Total amount', status:'Status', createdBy:'Created by' };

  let rows = applyFilters(orders, config.applyFilter ? (config.filters||[]) : []);
  if      (config.sortBy==='asc')       rows=[...rows].sort((a,b)=>(a.product||'').localeCompare(b.product||''));
  else if (config.sortBy==='desc')      rows=[...rows].sort((a,b)=>(b.product||'').localeCompare(a.product||''));
  else if (config.sortBy==='orderDate') rows=[...rows].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const total = rows.length;
  rows = rows.slice(0, pageSize);
  if (!rows.length) return <Empty/>;

  return (
    <div className="wgt-table-wrap">
      <div style={{overflowX:'auto'}}>
        <table className="wgt-table" style={{fontSize}}>
          <thead>
            <tr>{cols.map(c=><th key={c} style={{background:headerBg,color:'#fff'}}>{CLABELS[c]||c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((order,i)=>(
              <tr key={order._id||i}>
                {cols.map(c=><td key={c}>{getFieldValue(order,c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total>pageSize && <div className="wgt-table-footer">Showing {pageSize} of {total} rows</div>}
    </div>
  );
}