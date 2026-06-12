'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Key, User as UserIcon, Mail, Info } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loginSSO } = useAuth();
  const router = useRouter();
  
  const [loginType, setLoginType] = useState<'INTERNAL' | 'SSO'>('INTERNAL');
  
  // Fields for Internal Login
  const [username, setUsername] = useState('');
  
  // Fields for SSO Login
  const [email, setEmail] = useState('');
  
  // Common password field
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginType === 'INTERNAL') {
      if (!username || !password) {
        setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
        return;
      }
      setLoading(true);
      try {
        await login(username, password);
      } catch (err: any) {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu AD');
        return;
      }
      if (!email.endsWith('@mxv.com.vn')) {
        setError('Email bắt buộc phải thuộc tên miền Sở MXV (@mxv.com.vn)');
        return;
      }
      setLoading(true);
      try {
        await loginSSO(email, password);
      } catch (err: any) {
        setError(err.message || 'Đăng nhập Active Directory thất bại.');
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #111b36 0%, #060a13 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div>
          {/* Logo / Brand */}
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 20px 0 rgba(59, 130, 246, 0.2)'
          }}>
            <Shield size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '6px', color: '#fff' }}>
            MXV Shift Checklist
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sở Giao Dịch Hàng Hóa Việt Nam
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => {
              setLoginType('INTERNAL');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: loginType === 'INTERNAL' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: loginType === 'INTERNAL' ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Nội Bộ
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('SSO');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: loginType === 'SSO' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: loginType === 'SSO' ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Active Directory (SSO)
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.875rem',
            textAlign: 'left',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {loginType === 'INTERNAL' ? (
            /* Internal Login fields */
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đăng nhập"
                  style={{ paddingLeft: '44px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            /* SSO AD Login fields */
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Email Sở MXV
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@mxv.com.vn"
                  style={{ paddingLeft: '44px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              {loginType === 'INTERNAL' ? 'Mật khẩu' : 'Mật khẩu Active Directory'}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Key size={18} />
              </div>
              <input
                type="password"
                className="form-input"
                placeholder={loginType === 'INTERNAL' ? "Nhập mật khẩu" : "Mật khẩu miền AD"}
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {loginType === 'SSO' && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              display: 'flex',
              gap: '8px',
              lineHeight: '1.4'
            }}>
              <Info size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
              <div>
                Sử dụng email có đuôi <strong>@mxv.com.vn</strong> (ví dụ: <code>it_user@mxv.com.vn</code> hoặc <code>ops_user@mxv.com.vn</code>) và mật khẩu AD: <code>Mxv@2026</code> để giả lập đăng nhập đồng bộ.
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : (loginType === 'INTERNAL' ? 'Đăng Nhập' : 'Đăng Nhập SSO')}
          </button>
        </form>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          Hệ thống giám sát vận hành nội bộ IT Core v1.2.0
        </div>
      </div>
    </div>
  );
}
