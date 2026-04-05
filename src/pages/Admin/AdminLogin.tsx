import { useState, type FormEvent } from 'react';
import { adminAuth } from '../../services/adminService';
import './AdminStyles.css';

type Props = {
    onLogin: () => void;
};

export function AdminLogin({ onLogin }: Props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await adminAuth.login(username.trim().toLowerCase(), password.trim());
            onLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="login-box">
                <h1 className="login-title">Admin Access</h1>
                <p className="login-subtitle">Secure Dashboard Entry</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            className="login-input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Enter Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
