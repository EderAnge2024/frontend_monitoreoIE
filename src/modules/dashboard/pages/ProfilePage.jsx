import React, { useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { User, Lock, Key, CheckCircle, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setMessage(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Mi Perfil</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configuración de cuenta y seguridad.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Info Card */}
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ 
            width: '96px', 
            height: '96px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-light)', 
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: '0 auto 1.5rem auto'
          }}>
            {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>{user?.nombres} {user?.apellidos}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'capitalize' }}>{user?.role}</p>
          
          <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <User size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>DNI: {user?.dni}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Key size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.correo || 'Sin correo registrado'}</span>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Lock size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0 }}>Cambiar Contraseña</h3>
          </div>

          {message && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> {message}
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Contraseña Actual</label>
              <input 
                type="password" 
                className="input" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Nueva Contraseña</label>
              <input 
                type="password" 
                className="input" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Mínimo 6 caracteres.</p>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="label">Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                className="input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
