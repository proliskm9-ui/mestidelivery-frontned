import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Loader2, Lock, User } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const login = useStore(state => state.login);
  const telegramLogin = useStore(state => state.telegramLogin);
  const isLoading = useStore(state => state.isLoading);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tgAutoLogging, setTgAutoLogging] = useState(false);

  // Auto-login via Telegram WebApp when opened through the Partners bot
  useEffect(() => {
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (!tgWebApp) return;
    const user = tgWebApp.initDataUnsafe?.user;
    if (!user?.id) return;

    // Check if we already have a stored JWT for this session
    const existingToken = localStorage.getItem('delivery_jwt_token');
    if (existingToken) return; // Already logged in, no need to re-auth

    setTgAutoLogging(true);
    telegramLogin(user.id, user.username, user.first_name)
      .catch(() => {
        setTgAutoLogging(false);
      });
  }, [telegramLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Введите имя пользователя'); return; }
    if (!password.trim()) { setError('Введите пароль'); return; }
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверное имя пользователя или пароль');
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Animated blobs */}
      <div style={styles.blobs}>
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
        <div style={{ ...styles.blob, ...styles.blob3 }} />
      </div>

      {tgAutoLogging && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <img src="/Assets/general-green.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: 16 }} />
          <Loader2 size={32} style={{ color: '#35E07A', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Вход через Telegram...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Container */}
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoGlow} />
          <img src="/Assets/general-green.png" alt="Mestigo" style={styles.logoImg} />
        </div>

        {/* Card */}
        <div style={styles.card}>
          {/* Card shimmer border */}
          <div style={styles.cardBorder} />

          <div style={styles.cardContent}>
            <h1 style={styles.title}>Партнёрский вход</h1>
            <p style={styles.subtitle}>Управление рестораном и заказами</p>

            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Username input */}
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><User size={16} /></span>
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoFocus
                  style={styles.input}
                />
              </div>

              {/* Password input */}
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><Lock size={16} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={isLoading ? styles.btnDisabled : styles.btn}
              >
                {isLoading ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Войти в панель'
                )}
              </button>
            </form>
          </div>
        </div>

        <p style={styles.footer}>Mestigo Partner Dashboard · Secure Access</p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blobFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,60px) scale(1.15); } }
        @keyframes blobFloat2 { 0%,100% { transform: translate(0,0) scale(1.1); } 50% { transform: translate(-40px,-30px) scale(0.9); } }
        @keyframes blobFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-40px); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #111 inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#050806',
    overflow: 'hidden',
    zIndex: 100,
  },
  blobs: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.35,
    willChange: 'transform',
  },
  blob1: {
    top: '-15%',
    left: '-10%',
    width: '60vw',
    height: '60vw',
    background: 'radial-gradient(circle, #15803d, transparent 70%)',
    animation: 'blobFloat1 28s ease-in-out infinite',
  },
  blob2: {
    bottom: '-20%',
    right: '-10%',
    width: '65vw',
    height: '65vw',
    background: 'radial-gradient(circle, #21EA7C, transparent 70%)',
    animation: 'blobFloat2 34s ease-in-out infinite',
  },
  blob3: {
    top: '35%',
    left: '30%',
    width: '45vw',
    height: '45vw',
    background: 'radial-gradient(circle, #14532d, transparent 70%)',
    opacity: 0.2,
    animation: 'blobFloat3 42s ease-in-out infinite',
  },
  container: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: 400,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    animation: 'fadeUp 0.7s cubic-bezier(0.2,0.8,0.2,1)',
  },
  logoWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    background: 'radial-gradient(circle, rgba(33,234,124,0.25), transparent 70%)',
    filter: 'blur(20px)',
    borderRadius: '50%',
  },
  logoImg: {
    height: 64,
    width: 'auto',
    filter: 'drop-shadow(0 0 20px rgba(33,234,124,0.4))',
    position: 'relative',
  },
  card: {
    position: 'relative',
    width: '100%',
    borderRadius: 28,
    background: 'rgba(8,12,10,0.85)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 28,
    pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.04) 100%)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor' as any,
    maskComposite: 'exclude' as any,
    padding: 1,
    zIndex: 5,
  },
  cardContent: {
    padding: '36px 32px 32px',
    position: 'relative',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 8px',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    margin: '0 0 28px',
    fontWeight: 500,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrap: {
    position: 'relative',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    position: 'absolute',
    left: 18,
    color: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 2,
  },
  input: {
    width: '100%',
    padding: '17px 48px 17px 50px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    fontWeight: 500,
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    zIndex: 2,
  },
  btn: {
    width: '100%',
    padding: '17px',
    marginTop: 4,
    background: 'linear-gradient(135deg, #21EA7C 0%, #16c965 100%)',
    color: '#050a06',
    border: 'none',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 800,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 24px rgba(33,234,124,0.3), 0 4px 16px rgba(0,0,0,0.3)',
    letterSpacing: '0.3px',
    transition: 'all 0.2s',
  },
  btnDisabled: {
    width: '100%',
    padding: '17px',
    marginTop: 4,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.3)',
    border: 'none',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 800,
    fontFamily: 'inherit',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    margin: 0,
    fontWeight: 500,
  },
};
