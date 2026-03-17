import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetRenderer from './WidgetRenderer';

/* ── Constants ── */
const DATE_FILTERS = [
  { label:'All time', value:'all' }, { label:'Today', value:'today' },
  { label:'Last 7 Days', value:'7days' }, { label:'Last 30 Days', value:'30days' },
  { label:'Last 90 Days', value:'90days' },
];
const AXIS_OPTIONS = [
  {value:'product',label:'Product'},{value:'quantity',label:'Quantity'},
  {value:'unitPrice',label:'Unit price'},{value:'totalAmount',label:'Total amount'},
  {value:'status',label:'Status'},{value:'createdBy',label:'Created by'},{value:'duration',label:'Duration'},
];
const METRIC_OPTIONS = [
  {value:'customerId',label:'Customer ID'},{value:'customerName',label:'Customer name'},
  {value:'email',label:'Email id'},{value:'address',label:'Address'},
  {value:'orderDate',label:'Order date'},{value:'product',label:'Product'},
  {value:'createdBy',label:'Created by'},{value:'status',label:'Status'},
  {value:'totalAmount',label:'Total amount'},{value:'unitPrice',label:'Unit price'},{value:'quantity',label:'Quantity'},
];
const NUMERIC_METRICS = ['totalAmount','unitPrice','quantity'];
const TABLE_COLUMNS = [
  {value:'customerId',label:'Customer ID'},{value:'customerName',label:'Customer name'},
  {value:'email',label:'Email id'},{value:'phone',label:'Phone number'},
  {value:'address',label:'Address'},{value:'orderId',label:'Order ID'},
  {value:'orderDate',label:'Order date'},{value:'product',label:'Product'},
  {value:'quantity',label:'Quantity'},{value:'unitPrice',label:'Unit price'},
  {value:'totalAmount',label:'Total amount'},{value:'status',label:'Status'},{value:'createdBy',label:'Created by'},
];
const TYPE_LABELS = {
  'bar-chart':'Bar Chart','line-chart':'Line Chart','pie-chart':'Pie Chart',
  'area-chart':'Area Chart','scatter-plot':'Scatter Plot','table':'Table','kpi':'KPI Value',
};

function filterOrders(orders, range) {
  if (range === 'all') return orders;
  const cutoff = new Date();
  if (range === 'today') { cutoff.setHours(0,0,0,0); }
  else { const days={'7days':7,'30days':30,'90days':90}[range]; cutoff.setDate(cutoff.getDate()-days); }
  return orders.filter(o => new Date(o.createdAt) >= cutoff);
}

/* ── Skeleton loader ── */
function WidgetSkeleton() {
  return (
    <div className="widget-skeleton">
      <div className="skel-header">
        <div className="skel-bar w60"/>
        <div className="skel-bar w30"/>
      </div>
      <div className="skel-body">
        <div className="skel-chart"/>
      </div>
    </div>
  );
}

/* ── Toast ── */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`dash-toast dash-toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({
  orders, savedWidgets, loading,
  onDeleteWidget, onUpdateWidget, onFetchOrders,
  allLayouts, activeLayout, onSwitchLayout, onSaveLayout, onDeleteLayout,
}) {
  const [dateFilter,     setDateFilter]     = useState('all');
  const [settingsWidget, setSettingsWidget] = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [showLayouts,    setShowLayouts]     = useState(false);
  const [newLayoutName,  setNewLayoutName]   = useState('');
  const [exporting,      setExporting]       = useState(false);
  const navigate   = useNavigate();
  const dashRef    = useRef(null);
  const toastIdRef = useRef(0);

  

  /* ── Toast helper ── */
  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders, dateFilter), [orders, dateFilter]);

  /* ── Delete ── */
  const handleDelete = useCallback((id, title) => {
    if (window.confirm(`Remove "${title||'Untitled'}" from dashboard?`)) {
      onDeleteWidget(id);
      addToast(`"${title||'Untitled'}" removed`, 'success');
    }
  }, [onDeleteWidget, addToast]);

  /* ── Settings ── */
  const handleOpenSettings  = useCallback((widget) => setSettingsWidget(JSON.parse(JSON.stringify(widget))), []);
  const handleConfigChange  = useCallback((key, val) => setSettingsWidget(p => ({...p, config:{...p.config,[key]:val}})), []);
  const handleSaveSettings  = useCallback(() => {
    if (settingsWidget) {
      onUpdateWidget(settingsWidget);
      setSettingsWidget(null);
      addToast('Widget settings saved!', 'success');
    }
  }, [settingsWidget, onUpdateWidget, addToast]);

  /* ── Resize ── */
  const onResizeDown = useCallback((e, widget) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startCols = widget.config?.widthCols||4;
    const gridW  = (window.innerWidth - 96) / 12;
    const onMove = ev => {
      const delta   = Math.round((ev.clientX - startX) / Math.max(gridW, 40));
      const newCols = Math.max(1, Math.min(12, startCols + delta));
      onUpdateWidget({...widget, config:{...widget.config, widthCols:newCols}});
    };
    const onUp = () => { window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [onUpdateWidget]);

  /* ── Export dashboard as PDF ── */
  const handleExport = useCallback(async () => {
    setExporting(true);
    addToast('Preparing export...', 'success');
    try {
      window.print();
    } finally {
      setExporting(false);
    }
  }, [addToast]);

  /* ── Save new layout ── */
  const handleSaveNewLayout = useCallback(() => {
    if (!newLayoutName.trim()) return;
    onSaveLayout(newLayoutName.trim());
    setNewLayoutName('');
    setShowLayouts(false);
    addToast(`Layout "${newLayoutName.trim()}" saved!`, 'success');
  }, [newLayoutName, onSaveLayout, addToast]);

  const hasWidgets = savedWidgets && savedWidgets.length > 0;

  return (
    <div className={"dashboard-page"} ref={dashRef}>

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} />

      {/* ── Top bar ── */}
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h2>Dashboard</h2>
          {hasWidgets && (
            <div className="date-filter-wrap">
              <span className="date-filter-label">Show data for</span>
              <select className="date-filter-select" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}>
                {DATE_FILTERS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* Layout switcher */}
          {allLayouts && allLayouts.length > 0 && (
            <div className="layout-switcher">
              <select className="date-filter-select" value={activeLayout||''}
                onChange={e => onSwitchLayout(e.target.value)}>
                {allLayouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Save layout */}
          {hasWidgets && onSaveLayout && (
            <div style={{position:'relative'}}>
              <button type="button" className="btn" onClick={()=>setShowLayouts(p=>!p)}>
                Save Layout
              </button>
              {showLayouts && (
                <div className="layout-popup">
                  <input
                    type="text"
                    className="layout-input"
                    placeholder="Layout name..."
                    value={newLayoutName}
                    onChange={e=>setNewLayoutName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleSaveNewLayout()}
                    autoFocus
                  />
                  <button type="button" className="btn primary" style={{width:'100%',marginTop:8}}
                    onClick={handleSaveNewLayout}>Save</button>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {hasWidgets && (
            <button type="button" className="btn" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : '↓ Export PDF'}
            </button>
          )}

          <button type="button" className="btn primary" onClick={()=>navigate('/configure')}>
            Configure Dashboard
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasWidgets ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="4"  y="4"  width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
              <rect x="30" y="4"  width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
              <rect x="4"  y="30" width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
              <rect x="30" y="30" width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
            </svg>
          </div>
          <h3>No widgets configured yet</h3>
          <p>Click <strong>Configure Dashboard</strong> to add charts, KPIs, and tables.</p>
          <button type="button" className="btn primary" onClick={()=>navigate('/configure')}>Configure Dashboard</button>
        </div>
      ) : (
        <div className="dashboard-canvas-grid" id="dashboard-export-area">
          {savedWidgets.map(widget => {
            const cols = Math.min(widget.config?.widthCols||4, 12);
            return (
              <div key={widget.id} className="dashboard-widget-card" style={{'--col-span':cols}}>
                <div className="dwc-header">
                  <div className="dwc-header-left">
                    <span className="dwc-title">{widget.config?.title||'Untitled'}</span>
                    {widget.config?.description && (
                      <span className="dwc-desc">{widget.config.description}</span>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span className="dwc-badge">{TYPE_LABELS[widget.type]||widget.type}</span>
                    <button type="button" className="dwc-action-btn" title="Settings"
                      onClick={()=>handleOpenSettings(widget)}>⚙</button>
                    <button type="button" className="dwc-action-btn danger" title="Remove"
                      onClick={()=>handleDelete(widget.id,widget.config?.title)}>✕</button>
                  </div>
                </div>

                <div className="dwc-body">
                  {loading
                    ? <WidgetSkeleton/>
                    : <WidgetRenderer widget={widget} orders={filteredOrders}/>
                  }
                </div>

                <div className="dwc-resize-handle" title="Drag to resize"
                  onMouseDown={e=>onResizeDown(e,widget)}>
                  <span>⇔</span>
                  <span className="dwc-col-badge">{cols} col</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ RIGHT SIDE PANEL (spec-compliant) ══ */}
      {settingsWidget && (
        <div className="dwc-modal-overlay" onClick={e=>e.target===e.currentTarget&&setSettingsWidget(null)}>
          <div className="dwc-modal">
            <div className="dwc-modal-header">
              <div className="dwc-modal-header-left">
                <span className="dwc-modal-title">Widget Settings</span>
                <span className="dwc-modal-subtitle">{TYPE_LABELS[settingsWidget.type]||settingsWidget.type}</span>
              </div>
              <button type="button" className="dwc-modal-close" onClick={()=>setSettingsWidget(null)}>✕</button>
            </div>

            <div className="dwc-modal-body">
              {/* General */}
              <div className="settings-section">
                <div className="settings-section-title">General</div>
                <label className="settings-label">Widget title
                  <input type="text" className="settings-input" value={settingsWidget.config.title||''}
                    onChange={e=>handleConfigChange('title',e.target.value)}/>
                </label>
                <label className="settings-label">Widget type
                  <input type="text" className="settings-input" value={TYPE_LABELS[settingsWidget.type]||settingsWidget.type} readOnly/>
                </label>
                <label className="settings-label">Description
                  <textarea className="sp-input sp-textarea" rows={2}
                    value={settingsWidget.config.description||''}
                    onChange={e=>handleConfigChange('description',e.target.value)}
                    placeholder="Optional description"/>
                </label>
              </div>

              {/* Size */}
              <div className="settings-section">
                <div className="settings-section-title">Widget size</div>
                <div className="settings-row">
                  <label className="settings-label">Width (cols)
                    <input type="number" className="settings-input" min="1" max="12"
                      value={settingsWidget.config.widthCols||4}
                      onChange={e=>handleConfigChange('widthCols',Math.max(1,Math.min(12,Number(e.target.value))))}/>
                  </label>
                  <label className="settings-label">Height (rows)
                    <input type="number" className="settings-input" min="1"
                      value={settingsWidget.config.heightRows||4}
                      onChange={e=>handleConfigChange('heightRows',Math.max(1,Number(e.target.value)))}/>
                  </label>
                </div>
              </div>

              {/* Charts */}
              {['bar-chart','line-chart','area-chart','scatter-plot'].includes(settingsWidget.type) && (
                <div className="settings-section">
                  <div className="settings-section-title">Data setting</div>
                  <label className="settings-label">X-axis data
                    <select className="settings-input" value={settingsWidget.config.xAxis||'product'}
                      onChange={e=>handleConfigChange('xAxis',e.target.value)}>
                      {AXIS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="settings-label">Y-axis data
                    <select className="settings-input" value={settingsWidget.config.yAxis||'quantity'}
                      onChange={e=>handleConfigChange('yAxis',e.target.value)}>
                      {AXIS_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <div className="settings-section-title" style={{marginTop:12}}>Styling</div>
                  <label className="settings-label">Chart color
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input type="color" value={settingsWidget.config.chartColor||'#6366f1'}
                        onChange={e=>handleConfigChange('chartColor',e.target.value)}
                        style={{width:36,height:36,border:'none',cursor:'pointer',borderRadius:6}}/>
                      <input type="text" className="settings-input" style={{flex:1}}
                        value={settingsWidget.config.chartColor||'#6366f1'}
                        onChange={e=>handleConfigChange('chartColor',e.target.value)} maxLength={7}/>
                    </div>
                  </label>
                  <label className="settings-checkbox-label">
                    <input type="checkbox" checked={!!settingsWidget.config.showDataLabel}
                      onChange={e=>handleConfigChange('showDataLabel',e.target.checked)}/>
                    Show data label
                  </label>
                </div>
              )}

              {/* Pie */}
              {settingsWidget.type==='pie-chart' && (
                <div className="settings-section">
                  <div className="settings-section-title">Data setting</div>
                  <label className="settings-label">Choose chart data
                    <select className="settings-input" value={settingsWidget.config.chartData||'product'}
                      onChange={e=>handleConfigChange('chartData',e.target.value)}>
                      {AXIS_OPTIONS.filter(o=>o.value!=='duration').map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="settings-checkbox-label">
                    <input type="checkbox" checked={!!settingsWidget.config.showLegend}
                      onChange={e=>handleConfigChange('showLegend',e.target.checked)}/>
                    Show legend
                  </label>
                </div>
              )}

              {/* KPI */}
              {settingsWidget.type==='kpi' && (
                <div className="settings-section">
                  <div className="settings-section-title">Data setting</div>
                  <label className="settings-label">Select metric
                    <select className="settings-input" value={settingsWidget.config.metric||'totalAmount'}
                      onChange={e=>handleConfigChange('metric',e.target.value)}>
                      {METRIC_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="settings-label">Aggregation
                    <select className="settings-input" value={settingsWidget.config.aggregation||'sum'}
                      disabled={!NUMERIC_METRICS.includes(settingsWidget.config.metric)}
                      onChange={e=>handleConfigChange('aggregation',e.target.value)}>
                      <option value="sum">Sum</option>
                      <option value="average">Average</option>
                      <option value="count">Count</option>
                    </select>
                  </label>
                  <label className="settings-label">Data format
                    <select className="settings-input" value={settingsWidget.config.dataFormat||'number'}
                      onChange={e=>handleConfigChange('dataFormat',e.target.value)}>
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                    </select>
                  </label>
                  <label className="settings-label">Decimal precision
                    <input type="number" className="settings-input" min="0"
                      value={settingsWidget.config.decimalPrecision??0}
                      onChange={e=>handleConfigChange('decimalPrecision',Math.max(0,Number(e.target.value)))}/>
                  </label>
                </div>
              )}

              {/* Table */}
              {settingsWidget.type==='table' && (
                <div className="settings-section">
                  <div className="settings-section-title">Data setting</div>
                  <label className="settings-label">Choose columns
                    <div className="settings-multiselect">
                      {TABLE_COLUMNS.map(col=>(
                        <label key={col.value} className="settings-checkbox-label">
                          <input type="checkbox"
                            checked={(settingsWidget.config.columns||[]).includes(col.value)}
                            onChange={e=>{
                              const cols=settingsWidget.config.columns||[];
                              handleConfigChange('columns',e.target.checked?[...cols,col.value]:cols.filter(c=>c!==col.value));
                            }}/>
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </label>
                  <label className="settings-label">Sort by
                    <select className="settings-input" value={settingsWidget.config.sortBy||''}
                      onChange={e=>handleConfigChange('sortBy',e.target.value)}>
                      <option value="">None</option>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                      <option value="orderDate">Order date</option>
                    </select>
                  </label>
                  <label className="settings-label">Pagination
                    <select className="settings-input" value={settingsWidget.config.pagination||10}
                      onChange={e=>handleConfigChange('pagination',Number(e.target.value))}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </label>
                  <label className="settings-checkbox-label" style={{marginBottom:8}}>
                    <input type="checkbox" checked={!!settingsWidget.config.applyFilter}
                      onChange={e=>handleConfigChange('applyFilter',e.target.checked)}/>
                    Apply filter
                  </label>
                  {settingsWidget.config.applyFilter && (
                    <FilterBuilder
                      filters={settingsWidget.config.filters||[]}
                      onChange={f=>handleConfigChange('filters',f)}
                    />
                  )}
                  <div className="settings-section-title" style={{marginTop:12}}>Styling</div>
                  <label className="settings-label">Font size
                    <input type="number" className="settings-input" min="12" max="18"
                      value={settingsWidget.config.fontSize||14}
                      onChange={e=>handleConfigChange('fontSize',Math.min(18,Math.max(12,Number(e.target.value))))}/>
                  </label>
                  <label className="settings-label">Header background
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input type="color" value={settingsWidget.config.headerBg||'#54bd95'}
                        onChange={e=>handleConfigChange('headerBg',e.target.value)}
                        style={{width:36,height:36,border:'none',cursor:'pointer',borderRadius:6}}/>
                      <input type="text" className="settings-input" style={{flex:1}}
                        value={settingsWidget.config.headerBg||'#54bd95'}
                        onChange={e=>handleConfigChange('headerBg',e.target.value)} maxLength={7}/>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="dwc-modal-footer">
              <button type="button" className="btn" onClick={()=>setSettingsWidget(null)}>Cancel</button>
              <button type="button" className="btn primary" onClick={handleSaveSettings}>Save Changes</button>
            </div>
          </div>
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
    <div className="filter-builder" style={{marginBottom:8}}>
      {filters.map((f,i)=>(
        <div key={i} className="filter-row" style={{marginBottom:6}}>
          <select className="settings-input" style={{flex:1}} value={f.field} onChange={e=>update(i,'field',e.target.value)}>
            {TABLE_COLUMNS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="settings-input" style={{flex:1}} value={f.operator} onChange={e=>update(i,'operator',e.target.value)}>
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="gt">Greater than</option>
            <option value="lt">Less than</option>
          </select>
          <input type="text" className="settings-input" style={{flex:1}} value={f.value} placeholder="Value"
            onChange={e=>update(i,'value',e.target.value)}/>
          <button type="button" onClick={()=>remove(i)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:'0 4px'}}>✕</button>
        </div>
      ))}
      <button type="button" className="btn" style={{fontSize:'0.8rem',padding:'5px 10px'}} onClick={add}>+ Add filter</button>
    </div>
  );
}