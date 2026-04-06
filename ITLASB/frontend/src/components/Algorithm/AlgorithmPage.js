import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const mono = { fontFamily:'monospace', fontSize:12, lineHeight:1.8 };

export default function AlgorithmPage() {
  const [log,     setLog]     = useState([]);
  const [running, setRunning] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trucks,  setTrucks]  = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/drivers'), api.get('/trucks')]).then(([d, t]) => {
      setDrivers(d.data.filter(x => x.status === 'idle').slice(0, 5));
      setTrucks(t.data.filter(x => x.status === 'available').slice(0, 5));
    }).catch(() => {});
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const runDemo = async () => {
    setRunning(true); setLog([]); setStats(null);

    // Simulate backtracking locally with visual streaming
    const demoDrivers = drivers.length ? drivers : [
      { driver_id:'D-05', name:'Sanjay Kumar', current_lat:13.0900, current_lng:80.2900 },
      { driver_id:'D-09', name:'Vijay T',       current_lat:13.1100, current_lng:80.2000 },
    ];
    const demoTrucks = trucks.length ? trucks : [
      { truck_id:'T-04', current_lat:13.0900, current_lng:80.1900 },
      { truck_id:'T-06', current_lat:13.1400, current_lng:80.2300 },
      { truck_id:'T-11', current_lat:12.9500, current_lng:80.2400 },
    ];
    const work = { source_lat:13.0827, source_lng:80.2707, destination_lat:12.9249, destination_lng:80.1000, source_name:'Chennai Central', destination_name:'Tambaram' };

    const haversine = (lat1,lng1,lat2,lng2) => {
      const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
      const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
      return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    };

    const srcToDst = haversine(work.source_lat,work.source_lng,work.destination_lat,work.destination_lng);
    let bestCost = Infinity, bestD=null, bestT=null, iters=0, pruned=0;
    const steps = [];

    steps.push({ type:'init', msg:`🧠 Backtracking started`, sub:`${demoDrivers.length} drivers × ${demoTrucks.length} trucks, src→dst=${srcToDst.toFixed(1)}km` });

    for (const d of demoDrivers) {
      for (const t of demoTrucks) {
        iters++;
        const d2t = haversine(d.current_lat,d.current_lng,t.current_lat,t.current_lng);
        if (d2t >= bestCost) {
          pruned++;
          steps.push({ type:'prune', msg:`PRUNE ${d.driver_id}→${t.truck_id}`, sub:`driver→truck ${d2t.toFixed(1)}km ≥ best ${bestCost===Infinity?'∞':bestCost.toFixed(1)}km` });
          continue;
        }
        const t2s = haversine(t.current_lat,t.current_lng,work.source_lat,work.source_lng);
        const partial = d2t+t2s;
        if (partial >= bestCost) {
          pruned++;
          steps.push({ type:'prune', msg:`PRUNE ${d.driver_id}→${t.truck_id}`, sub:`partial ${partial.toFixed(1)}km ≥ best ${bestCost.toFixed(1)}km` });
          continue;
        }
        const total = partial + srcToDst;
        const isBest = total < bestCost;
        if (isBest) { bestCost=total; bestD=d; bestT=t; }
        steps.push({ type: isBest?'best':'try', msg:`Try: ${d.driver_id}→${t.truck_id}`, sub:`${d2t.toFixed(1)}+${t2s.toFixed(1)}+${srcToDst.toFixed(1)} = ${total.toFixed(1)}km${isBest?' ← NEW BEST ✓':''}` });
      }
    }

    steps.push({ type:'result', msg:`✅ Optimal: ${bestD?.driver_id||'—'} + ${bestT?.truck_id||'—'}`, sub:`Total cost: ${bestCost.toFixed(2)}km | ${iters} iterations | ${pruned} pruned` });

    // Stream steps with delay
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 180));
      setLog(prev => [...prev, steps[i]]);
    }
    setStats({ iterations: iters, pruned, bestCost: bestCost.toFixed(2), driver: bestD?.driver_id, truck: bestT?.truck_id });
    setRunning(false);
  };

  const logColor = { init:'var(--teal)', try:'var(--text2)', best:'var(--amber2)', prune:'var(--red)', result:'var(--green)' };

  return (
    <div style={{ padding:28, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, color:'var(--amber2)', letterSpacing:-.5 }}>Backtracking Optimizer</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>Explores all valid Driver → Truck → Work combinations. Prunes branches exceeding current best cost.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Cost function */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)', marginBottom:12 }}>Cost Function</div>
          <pre style={{ ...mono, color:'var(--teal)', background:'rgba(0,0,0,.35)', border:'1px solid #0d9488', borderRadius:8, padding:14 }}>{`Cost(driver, truck, work) =
  dist(driver → truck)        // Phase 1
  + dist(truck → work.source) // Phase 2
  + dist(source → destination)// Delivery

Pruning (α-β style):
  if dist(d→t) ≥ bestCost:
    return ← prune branch

  if dist(d→t) + dist(t→src) ≥ bestCost:
    return ← prune branch

  if total < bestCost:
    bestCost = total
    bestAssignment = (d, t)`}</pre>
          <div style={{ marginTop:14 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)', marginBottom:8 }}>Optimization</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
              Top-K nearest drivers and trucks are pre-sorted by distance to work source before backtracking begins, reducing the search tree from O(D×T) to O(K²).
            </div>
          </div>
        </div>

        {/* Live log */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)' }}>Live Execution Log</div>
            <button onClick={runDemo} disabled={running} style={{ padding:'6px 14px', background: running?'var(--bg4)':'var(--amber3)', border:'1px solid var(--amber)', borderRadius:6, color:'var(--amber2)', fontSize:12, fontWeight:700, fontFamily:'var(--font-head)', cursor: running?'not-allowed':'pointer', transition:'all .15s' }}>
              {running ? '⏳ Running…' : '▶ Run Demo'}
            </button>
          </div>
          <div ref={logRef} style={{ height:260, overflowY:'auto', background:'rgba(0,0,0,.35)', border:'1px solid var(--border2)', borderRadius:8, padding:12 }}>
            {log.length === 0 && <div style={{ ...mono, color:'var(--text3)' }}>Click "Run Demo" to visualize the algorithm…</div>}
            {log.map((l, i) => (
              <div key={i} style={{ marginBottom:2 }}>
                <span style={{ ...mono, color: logColor[l.type] || 'var(--text2)', textDecoration: l.type==='prune'?'line-through':'' }}>{l.msg}</span>
                <span style={{ ...mono, color:'var(--text3)', fontSize:11, marginLeft:8 }}>{l.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[['Best Cost', stats.bestCost+' km','var(--amber2)'],['Iterations', stats.iterations,'var(--teal)'],['Pruned', stats.pruned,'var(--red)'],['Assignment', `${stats.driver}+${stats.truck}`,'var(--green)']].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tree diagram */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)', marginBottom:14 }}>Assignment Tree — Example</div>
        <svg width="100%" viewBox="0 0 860 280" style={{ overflow:'visible' }}>
          {/* Root */}
          <rect x="355" y="10" width="150" height="36" rx="8" fill="#1e2330" stroke="#f59e0b" strokeWidth="1"/>
          <text x="430" y="33" textAnchor="middle" fill="#fbbf24" fontSize="13" fontFamily="Syne" fontWeight="700">Work Order</text>
          {/* Lines to drivers */}
          {[[160,100],[430,100],[700,100]].map(([x,y],i) => (
            <line key={i} x1="430" y1="46" x2={x} y2={y} stroke="#2a3040" strokeWidth="1"/>
          ))}
          {/* Drivers */}
          {[{x:100,y:100,label:'D-05 Sanjay',c:'#22c55e',bg:'#1c2e1a'},{x:370,y:100,label:'D-09 Vijay',c:'#4a5060',bg:'#1e2330'},{x:640,y:100,label:'D-03 Karthik',c:'#4a5060',bg:'#1e2330'}].map((d,i) => (
            <g key={i}>
              <rect x={d.x} y={d.y} width="120" height="32" rx="7" fill={d.bg} stroke={d.c} strokeWidth="1"/>
              <text x={d.x+60} y={d.y+21} textAnchor="middle" fill={d.c} fontSize="11" fontFamily="DM Sans">{d.label}</text>
            </g>
          ))}
          {/* Lines to trucks from D-05 */}
          {[[80,180],[160,180],[240,180]].map(([x,y],i) => (
            <line key={i} x1="160" y1="132" x2={x} y2={y} stroke={i===2?"#ef4444":"#22c55e"} strokeWidth="1" strokeDasharray="4 3" opacity={i===2?0.5:1}/>
          ))}
          {/* Trucks */}
          {[{x:40,y:180,label:'T-04 · 38km',c:'#22c55e',bg:'#1c2e1a'},{x:120,y:180,label:'T-06 · 51km',c:'#3b82f6',bg:'#1a1e2e'},{x:200,y:180,label:'T-11 · pruned',c:'#ef4444',bg:'#1f1010',cross:true}].map((t,i) => (
            <g key={i}>
              <rect x={t.x} y={t.y} width="76" height="28" rx="5" fill={t.bg} stroke={t.c} strokeWidth="1" opacity={t.cross?.5:1}/>
              <text x={t.x+38} y={t.y+18} textAnchor="middle" fill={t.c} fontSize="10" fontFamily="DM Sans" textDecoration={t.cross?'line-through':''}>{t.label}</text>
            </g>
          ))}
          {/* Best label */}
          <rect x="28" y="222" width="100" height="24" rx="5" fill="#14532d" stroke="#22c55e" strokeWidth="1"/>
          <text x="78" y="238" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="Syne" fontWeight="700">✓ OPTIMAL</text>
          {/* Legend */}
          {[['#22c55e','Optimal path'],['#3b82f6','Explored'],['#ef4444','Pruned']].map(([c,l],i) => (
            <g key={i}>
              <circle cx={560+i*120} cy="260" r="5" fill={c}/>
              <text x={572+i*120} y="264" fill="var(--text2)" fontSize="11" fontFamily="DM Sans">{l}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
