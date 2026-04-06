import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const s = {
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:56, background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:500 },
  logo: { fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, letterSpacing:'-.5px', color:'var(--amber2)', textDecoration:'none' },
  sub: { color:'var(--text2)', fontWeight:400, fontSize:12, marginLeft:8, letterSpacing:'.5px' },
  tabs: { display:'flex', gap:4 },
  tab: { padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight:500, color:'var(--text2)', border:'none', background:'transparent', textDecoration:'none', transition:'all .15s', display:'block' },
  activeTab: { color:'var(--amber2)', background:'var(--amber3)' },
  right: { display:'flex', gap:10, alignItems:'center' },
  badge: { padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:'.3px' },
  btn: { padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight:600, border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', transition:'all .15s' },
};

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { connected, drivers } = useSocket();
  const navigate = useNavigate();

  const delivering = drivers.filter(d => d.status === 'delivering').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabStyle = ({ isActive }) => ({ ...s.tab, ...(isActive ? s.activeTab : {}) });

  return (
    <nav style={s.nav}>
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        <NavLink to="/" style={s.logo}>ITLASB <span style={s.sub}>v2.0</span></NavLink>
        {user && (
          <div style={s.tabs}>
            {isAdmin && <NavLink to="/admin" style={tabStyle}>Admin</NavLink>}
            {isAdmin && <NavLink to="/algorithm" style={tabStyle}>Algorithm</NavLink>}
            {!isAdmin && <NavLink to="/dashboard" style={tabStyle}>My Orders</NavLink>}
            <NavLink to="/create-work" style={tabStyle}>New Work</NavLink>
          </div>
        )}
      </div>
      <div style={s.right}>
        <span style={{ ...s.badge, background: connected ? '#14532d' : '#3a1010', color: connected ? '#4ade80' : '#f87171', fontSize: 11 }}>
          {connected ? '● Connected' : '○ Offline'}
        </span>
        {delivering > 0 && (
          <span style={{ ...s.badge, background:'var(--amber3)', color:'var(--amber2)' }}>
            {delivering} Active
          </span>
        )}
        {user ? (
          <>
            <span style={{ fontSize:13, color:'var(--text2)' }}>{user.username}</span>
            <button style={s.btn} onClick={handleLogout} onMouseOver={e => e.target.style.color='var(--red)'} onMouseOut={e => e.target.style.color='var(--text2)'}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" style={{ ...s.btn, textDecoration:'none', color:'var(--text2)' }}>Login</NavLink>
        )}
      </div>
    </nav>
  );
}
