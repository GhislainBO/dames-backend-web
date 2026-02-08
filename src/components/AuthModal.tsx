/**
 * AuthModal - Modal d'authentification (Connexion / Inscription)
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Validation
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          setIsLoading(false);
          return;
        }

        const result = await register(username, email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || t('auth.registerError'));
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || t('auth.loginError'));
        }
      }
    } catch (err) {
      setError(t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  // Utiliser un Portal pour rendre le modal directement dans le body
  // Cela évite les problèmes de z-index avec les conteneurs parents
  return ReactDOM.createPortal(
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2>{mode === 'login' ? t('auth.login') : t('auth.register')}</h2>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">{t('auth.username')}</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
                minLength={3}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              minLength={6}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                minLength={6}
                required
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : (mode === 'login' ? t('auth.login') : t('auth.register'))}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>
              {t('auth.noAccount')}{' '}
              <button type="button" onClick={switchMode}>
                {t('auth.register')}
              </button>
            </p>
          ) : (
            <p>
              {t('auth.hasAccount')}{' '}
              <button type="button" onClick={switchMode}>
                {t('auth.login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AuthModal;
