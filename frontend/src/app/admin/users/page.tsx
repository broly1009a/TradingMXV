'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Users as UsersIcon,
  Shield,
  Layers,
  X,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface User {
  _id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'LEADER' | 'STAFF';
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
}

export default function AdminUsersPage() {
  const { user: currentUser, token } = useAuth();
  const router = useRouter();

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'LEADER' | 'STAFF'>('STAFF');
  const [departmentId, setDepartmentId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch departments
      const deptsRes = await fetch(`${API_BASE_URL}/api/v1/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const deptsData = await deptsRes.json();
      setDepartments(deptsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('STAFF');
    setDepartmentId('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword('');
    setFullName(u.fullName);
    setRole(u.role);
    setDepartmentId(u.departmentId?._id || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !fullName || !role || !departmentId) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      let res;
      if (editingUser) {
        // Update
        res = await fetch(`${API_BASE_URL}/api/v1/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username,
            ...(password ? { password } : {}),
            fullName,
            role,
            departmentId
          })
        });
      } else {
        // Create
        if (!password) {
          setError('Vui lòng nhập mật khẩu cho tài khoản mới');
          return;
        }
        res = await fetch(`${API_BASE_URL}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username,
            password,
            fullName,
            role,
            departmentId
          })
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Thao tác thất bại');
      }

      setSuccess(editingUser ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản mới thành công!');
      setTimeout(() => {
        setModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA tài khoản "${name}"?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Xóa tài khoản thất bại');
      }

      setSuccess('Đã xóa tài khoản.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Lỗi xảy ra');
    }
  };

  return (
    <ProtectedRoute>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: '4px' }}>
              Quản Lý Tài Khoản Cán Bộ
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Cấp phát, điều chỉnh phân quyền và phân phòng ban làm việc cho cán bộ vận hành trực checklist Sở.
            </p>
          </div>
          <button onClick={openAddModal} className="btn btn-primary" style={{ padding: '12px 20px' }}>
            <UserPlus size={18} /> Thêm tài khoản mới
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        {/* Users list grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Đang tải người dùng...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>Tên Đăng Nhập</th>
                    <th style={{ padding: '12px 16px' }}>Họ Và Tên</th>
                    <th style={{ padding: '12px 16px' }}>Phòng Ban Vận Hành</th>
                    <th style={{ padding: '12px 16px' }}>Quyền Hạn</th>
                    <th style={{ padding: '12px 16px' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.005)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>{u.username}</td>
                      <td style={{ padding: '14px 16px' }}>{u.fullName}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={14} color="var(--text-muted)" />
                          {u.departmentId?.name || 'Chưa phân phòng'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} color="var(--text-muted)" />
                          <strong style={{
                            color: u.role === 'ADMIN' ? 'var(--color-critical)' : u.role === 'LEADER' ? 'var(--color-high)' : 'var(--color-medium)'
                          }}>{u.role}</strong>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => openEditModal(u)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Edit size={14} /> Sửa
                          </button>
                          {u.username !== 'admin' && (
                            <button 
                              onClick={() => handleDelete(u._id, u.fullName)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444' }}
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Window */}
        {modalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass-panel animate-fade-in" style={{
              width: '100%',
              maxWidth: '480px',
              background: '#0d1326',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UsersIcon size={20} color="var(--color-accent)" /> 
                  {editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                </h2>
                <button 
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!!editingUser}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Mật khẩu {editingUser ? '(Bỏ trống nếu giữ nguyên)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Quyền hạn (Role) *
                  </label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    style={{ background: 'var(--bg-app)' }}
                  >
                    <option value="STAFF">STAFF (Nhân viên vận hành)</option>
                    <option value="LEADER">LEADER (Trưởng ca trực)</option>
                    <option value="ADMIN">ADMIN (Quản trị hệ thống)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Phòng ban trực *
                  </label>
                  <select
                    className="form-input"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    style={{ background: 'var(--bg-app)' }}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Lưu cấu hình
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
