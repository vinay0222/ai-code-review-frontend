import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPage() {
  const { login, signup } = useAuth();

  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isSignup = mode === 'signup';

  const toggle = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
    setPassword('');
    setConfirm('');
  };

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-email':            return 'Invalid email address.';
      case 'auth/user-not-found':           return 'No account found for this email.';
      case 'auth/wrong-password':           return 'Incorrect password.';
      case 'auth/invalid-credential':       return 'Invalid email or password.';
      case 'auth/email-already-in-use':     return 'An account with this email already exists.';
      case 'auth/weak-password':            return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests':        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':   return 'Network error. Check your connection.';
      default: return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // onAuthStateChanged in AuthContext handles redirect
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔍</div>
          <div className="auth-logo-text">
            <span className="auth-logo-title">AI Code Review</span>
            <span className="auth-logo-sub">Dashboard</span>
          </div>
        </div>

        <h2 className="auth-heading">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="auth-sub">
          {isSignup
            ? 'Start reviewing code smarter with AI.'
            : 'Sign in to your dashboard.'}
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: 16 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <><span className="btn-spinner" /> {isSignup ? 'Creating account…' : 'Signing in…'}</>
            ) : (
              isSignup ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>{isSignup ? 'Already have an account?' : "Don't have an account?"}</span>
          <button className="auth-toggle-btn" onClick={toggle} type="button">
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
