'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  History, 
  Users, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  ShieldAlert,
  Building2
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mxv_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('mxv_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge badge-critical';
      case 'LEADER': return 'badge badge-high';
      default: return 'badge badge-medium';
    }
  };

  if (!user) return null;

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'rgba(59, 130, 246, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <ShieldAlert size={20} color="#3b82f6" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>MXV CHECKLIST</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operations Portal</span>
        </div>
      </div>

      {/* User profile widget */}
      <div className="glass-panel" style={{
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        textAlign: 'left',
        border: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
          {user.fullName}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          {user.department?.name || 'Chưa phân phòng'}
        </p>
        <span className={getRoleBadgeClass(user.role)}>
          {user.role}
        </span>
      </div>

      {/* Menu links */}
      <nav style={{ flex: 1 }}>
        <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Bảng điều khiển</span>
        </Link>
        <Link href="/checklist" className={`nav-link ${pathname === '/checklist' ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Ca trực hiện tại</span>
        </Link>
        <Link href="/history" className={`nav-link ${pathname === '/history' ? 'active' : ''}`}>
          <History size={18} />
          <span>Tra cứu lịch sử</span>
        </Link>

        {user.role === 'ADMIN' && (
          <>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              margin: '20px 0 8px 16px'
            }}>
              Quản trị hệ thống
            </div>
            <Link href="/admin/departments" className={`nav-link ${pathname.startsWith('/admin/departments') ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>Quản lý phòng ban</span>
            </Link>
            <Link href="/admin/users" className={`nav-link ${pathname.startsWith('/admin/users') ? 'active' : ''}`}>
              <Users size={18} />
              <span>Quản lý tài khoản</span>
            </Link>
            <Link href="/admin/templates" className={`nav-link ${pathname.startsWith('/admin/templates') ? 'active' : ''}`}>
              <Settings size={18} />
              <span>Mẫu checklist</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom widgets */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button 
          onClick={toggleTheme}
          className="btn btn-secondary" 
          style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
        </button>

        <button 
          onClick={logout}
          className="btn btn-secondary" 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', padding: '10px 16px' }}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
