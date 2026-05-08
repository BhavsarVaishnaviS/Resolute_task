import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface SignupFormProps {
    onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!email) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Minimum 6 characters';
        if (password !== confirm) e.confirm = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/signup', { email, password });
            login(res.data.email, res.data.token);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.icon}>📝</div>
                    <h2 style={styles.title}>Create Account</h2>
                    <p style={styles.subtitle}>Register to access Student Management System</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {serverError && <div style={styles.errorBanner}>{serverError}</div>}

                    {[
                        { label: 'Email Address', value: email, setter: setEmail, key: 'email', type: 'email', placeholder: 'admin@example.com' },
                        { label: 'Password', value: password, setter: setPassword, key: 'password', type: 'password', placeholder: '••••••••' },
                        { label: 'Confirm Password', value: confirm, setter: setConfirm, key: 'confirm', type: 'password', placeholder: '••••••••' },
                    ].map(({ label, value, setter, key, type, placeholder }) => (
                        <div key={key} style={styles.field}>
                            <label style={styles.label}>{label}</label>
                            <input
                                type={type}
                                value={value}
                                onChange={(e) => setter(e.target.value)}
                                style={{ ...styles.input, ...(errors[key] ? styles.inputError : {}) }}
                                placeholder={placeholder}
                            />
                            {errors[key] && <span style={styles.errorText}>{errors[key]}</span>}
                        </div>
                    ))}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>

                    <p style={styles.switchText}>
                        Already have an account?{' '}
                        <span style={styles.link} onClick={onSwitchToLogin}>
                            Sign in
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    header: { textAlign: 'center', marginBottom: '32px' },
    icon: { fontSize: '48px', marginBottom: '12px' },
    title: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a2e' },
    subtitle: { margin: '8px 0 0', color: '#6b7280', fontSize: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
    input: {
        padding: '12px 16px',
        border: '1.5px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
    },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: '12px', color: '#ef4444' },
    errorBanner: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
    },
    button: {
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    switchText: { textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: 0 },
    link: { color: '#667eea', cursor: 'pointer', fontWeight: 600 },
};

export default SignupForm;
