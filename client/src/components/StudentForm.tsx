import React, { useState, useEffect } from 'react';
import { type StudentFormData } from '../types';
import { encryptStudentFields, hashEmailForIndex } from '../utils/crypto';
import api from '../utils/api';

interface StudentFormProps {
    editData?: { id: string; data: StudentFormData } | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const EMPTY_FORM: StudentFormData = {
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    courseEnrolled: '',
    password: '',
};

const COURSES = [
    'Computer Science',
    'Information Technology',
    'Data Science',
    'Artificial Intelligence',
    'Cybersecurity',
    'Software Engineering',
    'Electronics',
    'Mechanical Engineering',
];

const StudentForm: React.FC<StudentFormProps> = ({ editData, onSuccess, onCancel }) => {
    const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<StudentFormData>>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const isEdit = !!editData;

    useEffect(() => {
        if (editData?.data) setForm({ ...editData.data, password: '' });
        else setForm(EMPTY_FORM);
    }, [editData]);

    const validate = (): boolean => {
        const e: Partial<StudentFormData> = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.email) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.phoneNumber) e.phoneNumber = 'Phone is required';
        else if (!/^\d{10}$/.test(form.phoneNumber.replace(/\s/g, ''))) e.phoneNumber = 'Enter 10-digit phone';
        if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
        if (!form.gender) e.gender = 'Gender is required';
        if (!form.address.trim()) e.address = 'Address is required';
        if (!form.courseEnrolled) e.courseEnrolled = 'Course is required';
        if (!isEdit && !form.password) e.password = 'Password is required';
        else if (!isEdit && form.password.length < 6) e.password = 'Minimum 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;

        setLoading(true);
        try {
            // Build the payload — omit password on edit if left blank
            const payload: Record<string, string> = { ...form } as Record<string, string>;
            if (isEdit && !payload.password) delete payload.password;

            // Level-1: encrypt EACH field individually before sending to server
            const encryptedFields = encryptStudentFields(payload);
            const emailHash = hashEmailForIndex(form.email);

            if (isEdit && editData) {
                await api.put(`/student/${editData.id}`, { encryptedFields, emailHash });
            } else {
                await api.post('/register', { encryptedFields, emailHash });
            }

            onSuccess();
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Operation failed');
            console.error('Submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fields: Array<{
        name: keyof StudentFormData;
        label: string;
        type: string;
        placeholder?: string;
        options?: string[];
    }> = [
            { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
            { name: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '9876543210' },
            { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
            { name: 'address', label: 'Address', type: 'textarea', placeholder: '123, Main Street, City' },
            { name: 'courseEnrolled', label: 'Course Enrolled', type: 'select', options: COURSES },
            { name: 'password', label: isEdit ? 'New Password (leave blank to keep)' : 'Password', type: 'password', placeholder: '••••••••' },
        ];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>{isEdit ? '✏️ Edit Student' : '➕ Register New Student'}</h3>
                    <button style={styles.closeBtn} onClick={onCancel}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {serverError && <div style={styles.errorBanner}>{serverError}</div>}

                    <div style={styles.grid}>
                        {fields.map(({ name, label, type, placeholder, options }) => (
                            <div key={name} style={name === 'address' ? { ...styles.field, gridColumn: '1 / -1' } : styles.field}>
                                <label style={styles.label}>{label}</label>

                                {type === 'select' ? (
                                    <select
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        style={{ ...styles.input, ...(errors[name] ? styles.inputError : {}) }}
                                    >
                                        <option value="">-- Select --</option>
                                        {options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : type === 'textarea' ? (
                                    <textarea
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        rows={3}
                                        style={{ ...styles.input, ...(errors[name] ? styles.inputError : {}), resize: 'vertical' }}
                                    />
                                ) : (
                                    <input
                                        type={type}
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        style={{ ...styles.input, ...(errors[name] ? styles.inputError : {}) }}
                                    />
                                )}

                                {errors[name] && <span style={styles.errorText}>{errors[name]}</span>}
                            </div>
                        ))}
                    </div>

                    <div style={styles.encryptionNote}>
                        🔐 Each field is individually AES encrypted (Level 1) before transmission. Backend applies Level 2 encryption per field before storage.
                    </div>

                    <div style={styles.actions}>
                        <button type="button" style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                        <button type="submit" style={styles.submitBtn} disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Register Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
    },
    modal: {
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 32px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1,
    },
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
    closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' },
    form: { padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: 600, color: '#374151' },
    input: {
        padding: '10px 14px', border: '1.5px solid #e5e7eb',
        borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: '12px', color: '#ef4444' },
    errorBanner: {
        background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
        padding: '12px', borderRadius: '8px', fontSize: '14px',
    },
    encryptionNote: {
        background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
        padding: '12px 16px', borderRadius: '8px', fontSize: '13px',
    },
    actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    cancelBtn: {
        padding: '12px 24px', background: '#f3f4f6', border: 'none',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#374151',
    },
    submitBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff', border: 'none', borderRadius: '8px',
        cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
};

export default StudentForm;