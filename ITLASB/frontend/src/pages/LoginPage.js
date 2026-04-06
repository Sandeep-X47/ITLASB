import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ addToast }) {
  const [mode, setMode]       = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(username, password);
        addToast(`Welcome back, ${user.username}!`, 'success');
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        await register(username, password);
        addToast('Account created! Please log in.', 'success');
        setMode('login');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:380, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:16, padding:36 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:800, color:'var(--amber2)', letterSpacing:-1 }}>ITLASB</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, letterSpacing:'.5px' }}>INTELLIGENT TRUCK LOAD ASSIGNMENT</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:'var(--bg3)', borderRadius:8, padding:3, marginBottom:24 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'7px 0', borderRadius:6, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', background: mode===m ? 'var(--amber3)' : 'transparent', color: mode===m ? 'var(--amber2)' : 'var(--text2)' }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:6 }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. alice" required style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px 0', background: loading ? 'var(--bg4)' : 'linear-gradient(135deg, #451a03, #92400e)', border:'1px solid var(--amber)', borderRadius:8, color:'var(--amber2)', fontSize:14, fontWeight:700, fontFamily:'var(--font-head)', letterSpacing:'.3px', transition:'all .2s' }}>
            {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <div style={{ marginTop:20, padding:14, background:'var(--bg3)', borderRadius:8, fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>
          <strong style={{ color:'var(--amber2)' }}>Demo accounts:</strong><br />
          Admin: <code style={{ color:'var(--teal)' }}>admin / admin123</code><br />
          Customer: <code style={{ color:'var(--teal)' }}>alice / customer123</code>
        </div>
      </div>
    </div>
  );
}
