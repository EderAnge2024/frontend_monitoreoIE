import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { correo });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Mail size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Recuperar Contraseña</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ingresa tu correo institucional y te enviaremos las instrucciones.</p>
        </div>

        {message && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="input" 
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="ejemplo@institucion.edu.pe"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Enviando...' : <><Send size={18} /> Enviar Instrucciones</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
