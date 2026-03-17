import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const WIDGET_CATALOGUE = [
  { group:'Charts', items:[
    { type:'bar-chart',    label:'Bar Chart',    icon:'▦' },
    { type:'line-chart',   label:'Line Chart',   icon:'↗' },
    { type:'pie-chart',    label:'Pie Chart',    icon:'◕' },
    { type:'area-chart',   label:'Area Chart',   icon:'◿' },
    { type:'scatter-plot', label:'Scatter Plot', icon:'⁙' },
  ]},
  { group:'Tables', items:[{ type:'table', label:'Table',     icon:'▤' }]},
  { group:'KPIs',   items:[{ type:'kpi',   label:'KPI Value', icon:'◈' }]},
];

const DEFAULT_CONFIGS = {
  'bar-chart':    { title:'Untitled', widthCols:5, heightRows:5, xAxis:'product',  yAxis:'quantity',    chartColor:'#6366f1', showDataLabel:false },
  'line-chart':   { title:'Untitled', widthCols:5, heightRows:5, xAxis:'product',  yAxis:'quantity',    chartColor:'#6366f1', showDataLabel:false },
  'pie-chart':    { title:'Untitled', widthCols:4, heightRows:4, chartData:'product', showLegend:true },
  'area-chart':   { title:'Untitled', widthCols:5, heightRows:5, xAxis:'product',  yAxis:'quantity',    chartColor:'#6366f1', showDataLabel:false },
  'scatter-plot': { title:'Untitled', widthCols:5, heightRows:5, xAxis:'quantity', yAxis:'totalAmount', chartColor:'#6366f1', showDataLabel:false },
  'table':        { title:'Untitled', widthCols:4, heightRows:4, columns:['customerName','product','status'], sortBy:'', pagination:10, fontSize:14, headerBg:'#54bd95' },
  'kpi':          { title:'Untitled', widthCols:2, heightRows:2, metric:'totalAmount', aggregation:'sum', dataFormat:'number', decimalPrecision:0 },
};

const AXIS_OPTIONS    = [
  {value:'product',label:'Product'},{value:'quantity',label:'Quantity'},
  {value:'unitPrice',label:'Unit price'},{value:'totalAmount',label:'Total amount'},
  {value:'status',label:'Status'},{value:'createdBy',label:'Created by'},{value:'duration',label:'Duration'},
];
const METRIC_OPTIONS  = [
  {value:'customerId',label:'Customer ID'},{value:'customerName',label:'Customer name'},
  {value:'email',label:'Email id'},{value:'address',label:'Address'},
  {value:'orderDate',label:'Order date'},{value:'product',label:'Product'},
  {value:'createdBy',label:'Created by'},{value:'status',label:'Status'},
  {value:'totalAmount',label:'Total amount'},{value:'unitPrice',label:'Unit price'},{value:'quantity',label:'Quantity'},
];
const NUMERIC_METRICS = ['totalAmount','unitPrice','quantity'];
const TABLE_COLUMNS   = [
  {value:'customerId',label:'Customer ID'},{value:'customerName',label:'Customer name'},
  {value:'email',label:'Email id'},{value:'phone',label:'Phone number'},
  {value:'address',label:'Address'},{value:'orderId',label:'Order ID'},
  {value:'orderDate',label:'Order date'},{value:'product',label:'Product'},
  {value:'quantity',label:'Quantity'},{value:'unitPrice',label:'Unit price'},
  {value:'totalAmount',label:'Total amount'},{value:'status',label:'Status'},{value:'createdBy',label:'Created by'},
];

let _id = Date.now();
const uid = () => _id++;

export default function ConfigurePage({ onSave, savedWidgets = [] }) {
  const navigate = useNavigate();

  /* initialise from savedWidgets so "Configure Dashboard" edits existing layout */
  const [widgets,      setWidgets]      = useState(() =>
    savedWidgets.length > 0
      ? savedWidgets.map(w => ({ ...w, id: w.id ?? uid() }))
      : []
  );
  const [activeWidget, setActiveWidget] = useState(null);
  const [openGroups,   setOpenGroups]   = useState({ Charts:true, Tables:true, KPIs:true });
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState('');
  const [dragOverId,   setDragOverId]   = useState(null);

  const dragSrc  = useRef(null);
  const resizeRef = useRef(null);

  const toggleGroup = g => setOpenGroups(p => ({...p, [g]:!p[g]}));

  /* ── sidebar drag start ── */
  const onSidebarDragStart = useCallback(type => {
    dragSrc.current = { source:'sidebar', type };
  }, []);

  /* ── canvas widget drag start (reorder) ── */
  const onWidgetDragStart = useCallback((e, id) => {
    dragSrc.current = { source:'canvas', id };
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  /* ── drag over a card ── */
  const onCardDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(id);
  }, []);

  /* ── drop on a card ── */
  const onCardDrop = useCallback((e, targetId, targetIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const src = dragSrc.current;
    if (!src) return;

    if (src.source === 'sidebar') {
      const newW = { id:uid(), type:src.type, config:{...DEFAULT_CONFIGS[src.type]} };
      setWidgets(prev => {
        const next = [...prev];
        next.splice(targetIdx, 0, newW);
        return next;
      });
      setActiveWidget(newW.id);
    } else if (src.source === 'canvas' && src.id !== targetId) {
      setWidgets(prev => {
        const next = [...prev];
        const fi   = next.findIndex(w => w.id === src.id);
        const ti   = next.findIndex(w => w.id === targetId);
        if (fi < 0 || ti < 0) return prev;
        const [item] = next.splice(fi, 1);
        next.splice(ti, 0, item);
        return next;
      });
    }
    dragSrc.current = null;
  }, []);

  /* ── drop on empty canvas ── */
  const onEmptyDrop = useCallback(e => {
    e.preventDefault();
    const src = dragSrc.current;
    if (!src || src.source !== 'sidebar') return;
    const newW = { id:uid(), type:src.type, config:{...DEFAULT_CONFIGS[src.type]} };
    setWidgets(prev => [...prev, newW]);
    setActiveWidget(newW.id);
    dragSrc.current = null;
  }, []);

  /* ── remove ── */
  const removeWidget = useCallback(id => {
    if (!window.confirm('Remove this widget?')) return;
    setWidgets(p => p.filter(w => w.id !== id));
    if (activeWidget === id) setActiveWidget(null);
  }, [activeWidget]);

  /* ── update config field ── */
  const updateConfig = useCallback((id, key, value) => {
    setWidgets(p => p.map(w => w.id === id ? {...w, config:{...w.config, [key]:value}} : w));
  }, []);

  /* ── resize handle mousedown ── */
  const onResizeDown = useCallback((e, id, startCols) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;

    const onMove = ev => {
      const dx       = ev.clientX - startX;
      const colW     = (window.innerWidth - 280 - 220 - 64) / 12;
      const delta    = Math.round(dx / Math.max(colW, 40));
      const newCols  = Math.max(1, Math.min(12, startCols + delta));
      setWidgets(p => p.map(w => w.id === id ? {...w, config:{...w.config, widthCols:newCols}} : w));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, []);

  /* ── save to MongoDB with localStorage fallback ── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/dashboard', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ widgets }),
      });
      if (!res.ok) throw new Error('server');
      const data = await res.json();
      onSave(data);
      setSaveMsg('Saved to server!');
    } catch {
      onSave(widgets);
      try { localStorage.setItem('hal_widgets', JSON.stringify(widgets)); } catch {}
      setSaveMsg('Saved locally');
    } finally {
      setSaving(false);
      setTimeout(() => { setSaveMsg(''); navigate('/'); }, 900);
    }
  }, [widgets, onSave, navigate]);

  const activeData = widgets.find(w => w.id === activeWidget);

  return (
    <div className="cfg-layout">

      {/* ── Sidebar ── */}
      <aside className="cfg-sidebar">
        <div className="cfg-sidebar-header">Widgets</div>
        {WIDGET_CATALOGUE.map(group => (
          <div key={group.group} className="cfg-group">
            <button type="button" className="cfg-group-toggle" onClick={() => toggleGroup(group.group)}>
              <span className={`cfg-group-arrow ${openGroups[group.group] ? 'open' : ''}`}>›</span>
              {group.group}
            </button>
            {openGroups[group.group] && (
              <div className="cfg-group-items">
                {group.items.map(item => (
                  <div key={item.type} className="cfg-widget-pill" draggable
                    onDragStart={() => onSidebarDragStart(item.type)}>
                    <span className="cfg-widget-pill-icon">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* ── Canvas ── */}
      <main className="cfg-canvas-wrap">
        <div className="cfg-canvas-topbar">
          <h2>Dashboard Configuration</h2>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {saveMsg && <span className="cfg-save-msg">{saveMsg}</span>}
            <button type="button" className="btn" onClick={() => navigate('/')}>Cancel</button>
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Configuration'}
            </button>
          </div>
        </div>

        <div
          className={`cfg-canvas${widgets.length === 0 ? ' empty' : ''}`}
          onDragOver={widgets.length === 0 ? e => e.preventDefault() : undefined}
          onDrop={widgets.length === 0 ? onEmptyDrop : undefined}
        >
          {widgets.length === 0 && (
            <div className="cfg-canvas-empty">
              <div className="cfg-canvas-empty-icon">⊞</div>
              <p>Drag widgets here to build your dashboard</p>
            </div>
          )}

          {widgets.map((widget, idx) => (
            <div
              key={widget.id}
              className={`cfg-widget-card${activeWidget === widget.id ? ' active' : ''}${dragOverId === widget.id ? ' drag-over-card' : ''}`}
              style={{'--col-span': Math.min(widget.config?.widthCols || 4, 12)}}
              draggable
              onDragStart={e => onWidgetDragStart(e, widget.id)}
              onDragOver={e => onCardDragOver(e, widget.id)}
              onDrop={e => onCardDrop(e, widget.id, idx)}
              onDragLeave={e => { e.stopPropagation(); setDragOverId(null); }}
              onClick={() => setActiveWidget(widget.id === activeWidget ? null : widget.id)}
            >
              <div className="cfg-widget-card-header">
                <span className="cfg-drag-handle" title="Drag to reorder">⠿</span>
                <span className="cfg-widget-type-badge">{widget.type.replace('-',' ')}</span>
                <span className="cfg-widget-card-title">{widget.config?.title || 'Untitled'}</span>
                <span className="cfg-col-badge">{widget.config?.widthCols || 4}col</span>
                <div className="cfg-widget-actions">
                  <button type="button" className="cfg-action-btn settings" title="Settings"
                    onClick={e => { e.stopPropagation(); setActiveWidget(widget.id === activeWidget ? null : widget.id); }}>⚙</button>
                  <button type="button" className="cfg-action-btn delete" title="Delete"
                    onClick={e => { e.stopPropagation(); removeWidget(widget.id); }}>✕</button>
                </div>
              </div>

              <div className="cfg-widget-card-preview">
                <WidgetPreview type={widget.type} />
              </div>

              {/* Resize handle */}
              <div
                className="cfg-resize-handle"
                title="Drag to resize columns"
                onMouseDown={e => onResizeDown(e, widget.id, widget.config?.widthCols || 4)}
                onClick={e => e.stopPropagation()}
              >
                <span>⇔</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Settings Panel ── */}
      {activeData && (
        <aside className="cfg-settings-panel">
          <div className="cfg-settings-header">
            <span>Widget Settings</span>
            <button type="button" className="cfg-close-btn" onClick={() => setActiveWidget(null)}>✕</button>
          </div>
          <WidgetSettingsPanel
            widget={activeData}
            onChange={(key, val) => updateConfig(activeData.id, key, val)}
          />
        </aside>
      )}
    </div>
  );
}

function WidgetPreview({ type }) {
  const map = {
    'bar-chart':    <div className="preview-bar"><span/><span/><span/><span/><span/></div>,
    'line-chart':   <svg viewBox="0 0 80 40" width="80" height="40"><polyline points="0,35 20,20 40,25 60,10 80,15" fill="none" stroke="#6366f1" strokeWidth="2"/></svg>,
    'pie-chart':    <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="16" fill="none" stroke="#6366f1" strokeWidth="10" strokeDasharray="50 100"/><circle cx="20" cy="20" r="16" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray="30 100" strokeDashoffset="-50"/><circle cx="20" cy="20" r="16" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="20 100" strokeDashoffset="-80"/></svg>,
    'area-chart':   <svg viewBox="0 0 80 40" width="80" height="40"><polyline points="0,35 20,20 40,25 60,10 80,15 80,40 0,40" fill="#6366f133" stroke="#6366f1" strokeWidth="1.5"/></svg>,
    'scatter-plot': <div className="preview-scatter"><span/><span/><span/><span/><span/><span/></div>,
    'table':        <div className="preview-table"><span/><span/><span/></div>,
    'kpi':          <div className="preview-kpi"><strong>2,450</strong><small>Total</small></div>,
  };
  return <div className="widget-preview">{map[type]||null}</div>;
}

function WidgetSettingsPanel({ widget, onChange }) {
  const { type, config } = widget;
  const isChart = ['bar-chart','line-chart','area-chart','scatter-plot'].includes(type);

  return (
    <div className="cfg-settings-body">
      <div className="settings-section">
        <label className="settings-label">Widget title <span className="req">*</span>
          <input type="text" className="settings-input" value={config.title} onChange={e=>onChange('title',e.target.value)}/>
        </label>
        <label className="settings-label">Widget type
          <input type="text" className="settings-input" value={type.replace('-',' ')} readOnly/>
        </label>
        <label className="settings-label">Description
          <textarea className="settings-input settings-textarea" rows={2}
            value={config.description||''} placeholder="Optional description"
            onChange={e=>onChange('description',e.target.value)}/>
        </label>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Widget size</div>
        <div className="settings-row">
          <label className="settings-label">Width (cols) <span className="req">*</span>
            <input type="number" className="settings-input" min="1" max="12" value={config.widthCols}
              onChange={e=>onChange('widthCols',Math.max(1,Math.min(12,Number(e.target.value))))}/>
          </label>
          <label className="settings-label">Height (rows) <span className="req">*</span>
            <input type="number" className="settings-input" min="1" value={config.heightRows}
              onChange={e=>onChange('heightRows',Math.max(1,Number(e.target.value)))}/>
          </label>
        </div>
      </div>

      {isChart && (
        <div className="settings-section">
          <div className="settings-section-title">Data setting</div>
          <label className="settings-label">X-axis data <span className="req">*</span>
            <select className="settings-input" value={config.xAxis} onChange={e=>onChange('xAxis',e.target.value)}>
              {AXIS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="settings-label">Y-axis data <span className="req">*</span>
            <select className="settings-input" value={config.yAxis} onChange={e=>onChange('yAxis',e.target.value)}>
              {AXIS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <div className="settings-section-title" style={{marginTop:12}}>Styling</div>
          <label className="settings-label">Chart color
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="color" value={config.chartColor} onChange={e=>onChange('chartColor',e.target.value)}
                style={{width:36,height:32,border:'none',cursor:'pointer',background:'none'}}/>
              <input type="text" className="settings-input" style={{flex:1}} value={config.chartColor}
                onChange={e=>onChange('chartColor',e.target.value)} maxLength={7} placeholder="#6366f1"/>
            </div>
          </label>
          <label className="settings-label settings-checkbox-label">
            <input type="checkbox" checked={!!config.showDataLabel} onChange={e=>onChange('showDataLabel',e.target.checked)}/>
            Show data label
          </label>
        </div>
      )}

      {type==='pie-chart' && (
        <div className="settings-section">
          <div className="settings-section-title">Data setting</div>
          <label className="settings-label">Choose chart data <span className="req">*</span>
            <select className="settings-input" value={config.chartData} onChange={e=>onChange('chartData',e.target.value)}>
              {AXIS_OPTIONS.filter(o=>o.value!=='duration').map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="settings-label settings-checkbox-label">
            <input type="checkbox" checked={!!config.showLegend} onChange={e=>onChange('showLegend',e.target.checked)}/>
            Show legend
          </label>
        </div>
      )}

      {type==='kpi' && (
        <div className="settings-section">
          <div className="settings-section-title">Data setting</div>
          <label className="settings-label">Select metric <span className="req">*</span>
            <select className="settings-input" value={config.metric} onChange={e=>onChange('metric',e.target.value)}>
              {METRIC_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="settings-label">Aggregation <span className="req">*</span>
            <select className="settings-input" value={config.aggregation}
              disabled={!NUMERIC_METRICS.includes(config.metric)}
              onChange={e=>onChange('aggregation',e.target.value)}>
              <option value="sum">Sum</option>
              <option value="average">Average</option>
              <option value="count">Count</option>
            </select>
          </label>
          <label className="settings-label">Data format <span className="req">*</span>
            <select className="settings-input" value={config.dataFormat} onChange={e=>onChange('dataFormat',e.target.value)}>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
            </select>
          </label>
          <label className="settings-label">Decimal precision <span className="req">*</span>
            <input type="number" className="settings-input" min="0" value={config.decimalPrecision}
              onChange={e=>onChange('decimalPrecision',Math.max(0,Number(e.target.value)))}/>
          </label>
        </div>
      )}

      {type==='table' && (
        <div className="settings-section">
          <div className="settings-section-title">Data setting</div>
          <label className="settings-label">Choose columns <span className="req">*</span>
            <div className="settings-multiselect">
              {TABLE_COLUMNS.map(col=>(
                <label key={col.value} className="settings-checkbox-label">
                  <input type="checkbox"
                    checked={(config.columns||[]).includes(col.value)}
                    onChange={e=>{
                      const cols=config.columns||[];
                      onChange('columns',e.target.checked?[...cols,col.value]:cols.filter(c=>c!==col.value));
                    }}/>
                  {col.label}
                </label>
              ))}
            </div>
          </label>
          <label className="settings-label">Sort by
            <select className="settings-input" value={config.sortBy||''} onChange={e=>onChange('sortBy',e.target.value)}>
              <option value="">None</option>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
              <option value="orderDate">Order date</option>
            </select>
          </label>
          <label className="settings-label">Pagination
            <select className="settings-input" value={config.pagination||10} onChange={e=>onChange('pagination',Number(e.target.value))}>
              <option value={5}>5</option><option value={10}>10</option><option value={15}>15</option>
            </select>
          </label>
          <label className="settings-label settings-checkbox-label">
            <input type="checkbox" checked={!!config.applyFilter} onChange={e=>onChange('applyFilter',e.target.checked)}/>
            Apply filter
          </label>
          {config.applyFilter && (
            <div className="settings-filter-section">
              <FilterBuilder filters={config.filters||[]} onChange={f=>onChange('filters',f)}/>
            </div>
          )}
          <div className="settings-section-title" style={{marginTop:12}}>Styling</div>
          <label className="settings-label">Font size
            <input type="number" className="settings-input" min="12" max="18" value={config.fontSize||14}
              onChange={e=>onChange('fontSize',Math.min(18,Math.max(12,Number(e.target.value))))}/>
          </label>
          <label className="settings-label">Header background
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="color" value={config.headerBg||'#54bd95'} onChange={e=>onChange('headerBg',e.target.value)}
                style={{width:36,height:32,border:'none',cursor:'pointer',background:'none'}}/>
              <input type="text" className="settings-input" style={{flex:1}}
                value={config.headerBg||'#54bd95'} onChange={e=>onChange('headerBg',e.target.value)} maxLength={7}/>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}

function FilterBuilder({ filters, onChange }) {
  const add    = () => onChange([...filters,{field:'status',operator:'equals',value:''}]);
  const remove = i  => onChange(filters.filter((_,j)=>j!==i));
  const update = (i,k,v) => { const n=[...filters]; n[i]={...n[i],[k]:v}; onChange(n); };
  return (
    <div className="filter-builder">
      {filters.map((f,i)=>(
        <div key={i} className="filter-row">
          <select className="settings-input" style={{flex:1}} value={f.field} onChange={e=>update(i,'field',e.target.value)}>
            {TABLE_COLUMNS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="settings-input" style={{flex:1}} value={f.operator} onChange={e=>update(i,'operator',e.target.value)}>
            <option value="equals">Equals</option><option value="contains">Contains</option>
            <option value="gt">Greater than</option><option value="lt">Less than</option>
          </select>
          <input type="text" className="settings-input" style={{flex:1}} value={f.value} placeholder="Value"
            onChange={e=>update(i,'value',e.target.value)}/>
          <button type="button" className="cfg-action-btn delete" onClick={()=>remove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="btn" style={{marginTop:6,fontSize:'0.8rem',padding:'6px 12px'}} onClick={add}>
        + Add filter
      </button>
    </div>
  );
}