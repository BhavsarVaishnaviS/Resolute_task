import React, { useState, useEffect, useCallback } from 'react';
import { type StudentRecord, type StudentFormData } from '../types';
import { decryptStudentPayload } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StudentForm from './StudentForm';

const ADMIN_EMAIL = 'admin@gmail.com';

const StudentList: React.FC = () => {
    const { logout, userEmail } = useAuth();
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<{ id: string; data: StudentFormData } | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/students');
            const { students: rawStudents, isAdmin: adminFlag } = res.data;
            setIsAdmin(adminFlag);
            // Backend returns Level-1 encrypted payloads. Frontend decrypts.
            const decrypted: StudentRecord[] = rawStudents.map((s: StudentRecord) => ({
                ...s,
                data: decryptStudentPayload<StudentFormData>(s.encryptedPayload),
            }));
            setStudents(decrypted);
        } catch (err) {
            showToast('Failed to load students', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/student/${id}`);
            showToast('Student deleted successfully');
            setDeleteId(null);
            fetchStudents();
        } catch {
            showToast('Delete failed', 'error');
        }
    };

    const handleEditClick = (student: StudentRecord) => {
        if (student.data) {
            setEditTarget({ id: student.id, data: student.data });
            setShowForm(true);
        }
    };

    const filteredStudents = students.filter((s) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            s.data?.fullName.toLowerCase().includes(q) ||
            s.data?.email.toLowerCase().includes(q) ||
            s.data?.courseEnrolled.toLowerCase().includes(q)
        );
    });

    // Non-admin users can only add one student. Disable button if they already have one.
    const canAddStudent = isAdmin || students.length === 0;

    return (
        <div style={styles.page}>
            {/* Toast */}
            {toast && (
                <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>🎓</span>
                    <div>
                        <h1 style={styles.title}>Student Management</h1>
                        <p style={styles.subtitle}>
                            Logged in as {userEmail}
                            {isAdmin && <span style={styles.adminBadge}>👑 Admin</span>}
                        </p>
                    </div>
                </div>
                <button style={styles.logoutBtn} onClick={logout}>Logout</button>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <input
                    type="text"
                    placeholder="🔍 Search by name, email, or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
                {canAddStudent ? (
                    <button style={styles.addBtn} onClick={() => { setEditTarget(null); setShowForm(true); }}>
                        + Add Student
                    </button>
                ) : (
                    <div style={styles.limitNote} title="Only admin@gmail.com can add multiple students">
                        🔒 1 student limit reached
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={styles.stats}>
                <div style={styles.statCard}>
                    <span style={styles.statNum}>{students.length}</span>
                    <span style={styles.statLabel}>Total Students</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNum}>{filteredStudents.length}</span>
                    <span style={styles.statLabel}>Filtered Results</span>
                </div>
                <div style={{ ...styles.statCard, background: '#f0fdf4' }}>
                    <span style={{ ...styles.statNum, color: '#166534' }}>🔐 2-Layer</span>
                    <span style={styles.statLabel}>AES Encryption Active</span>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={styles.emptyState}>Loading students...</div>
            ) : filteredStudents.length === 0 ? (
                <div style={styles.emptyState}>
                    {searchTerm ? 'No students match your search.' : 'No students yet. Add your first student!'}
                </div>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {['#', 'Full Name', 'Email', 'Phone', 'Course', 'Gender', 'DOB', 'Actions'].map((h) => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s, i) => (
                                <tr key={s.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                    <td style={styles.td}>{i + 1}</td>
                                    <td style={{ ...styles.td, fontWeight: 600 }}>{s.data?.fullName}</td>
                                    <td style={styles.td}>{s.data?.email}</td>
                                    <td style={styles.td}>{s.data?.phoneNumber}</td>
                                    <td style={styles.td}>
                                        <span style={styles.courseBadge}>{s.data?.courseEnrolled}</span>
                                    </td>
                                    <td style={styles.td}>{s.data?.gender}</td>
                                    <td style={styles.td}>{s.data?.dateOfBirth}</td>
                                    <td style={styles.td}>
                                        <div style={styles.actionBtns}>
                                            <button style={styles.editBtn} onClick={() => handleEditClick(s)}>Edit</button>
                                            <button style={styles.deleteBtn} onClick={() => setDeleteId(s.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Student Form Modal */}
            {showForm && (
                <StudentForm
                    editData={editTarget}
                    onSuccess={() => { setShowForm(false); fetchStudents(); showToast(editTarget ? 'Student updated!' : 'Student registered!'); }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* Confirm Delete Modal */}
            {deleteId && (
                <div style={styles.overlay}>
                    <div style={styles.confirmModal}>
                        <h3 style={{ margin: '0 0 12px', color: '#1a1a2e' }}>⚠️ Confirm Delete</h3>
                        <p style={{ margin: '0 0 24px', color: '#6b7280' }}>This action cannot be undone.</p>
                        <div style={styles.confirmActions}>
                            <button style={styles.cancelConfirmBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                            <button style={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '0' },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    logo: { fontSize: '36px' },
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.75)' },
    logoutBtn: {
        padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: '#fff',
        border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '8px',
        cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
    toolbar: {
        padding: '24px 32px', display: 'flex', gap: '12px', alignItems: 'center',
    },
    searchInput: {
        flex: 1, padding: '12px 16px', border: '1.5px solid #e5e7eb',
        borderRadius: '8px', fontSize: '14px', outline: 'none',
    },
    addBtn: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff', border: 'none', borderRadius: '8px',
        cursor: 'pointer', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap',
    },
    stats: {
        display: 'flex', gap: '16px', padding: '0 32px 24px',
    },
    statCard: {
        background: '#fff', borderRadius: '12px', padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '4px',
    },
    statNum: { fontSize: '24px', fontWeight: 700, color: '#667eea' },
    statLabel: { fontSize: '12px', color: '#6b7280' },
    tableWrapper: {
        margin: '0 32px 32px', borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: '#fff',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '14px 16px', background: '#f8fafc', textAlign: 'left',
        fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb',
    },
    td: { padding: '14px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f0f0f0' },
    trEven: { background: '#fff' },
    trOdd: { background: '#fafafa' },
    courseBadge: {
        background: '#ede9fe', color: '#5b21b6', padding: '4px 10px',
        borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    },
    actionBtns: { display: 'flex', gap: '8px' },
    editBtn: {
        padding: '6px 14px', background: '#dbeafe', color: '#1d4ed8',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
    },
    deleteBtn: {
        padding: '6px 14px', background: '#fee2e2', color: '#dc2626',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
    },
    emptyState: {
        textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '16px',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    confirmModal: {
        background: '#fff', borderRadius: '16px', padding: '32px',
        width: '360px', boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
    },
    confirmActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    cancelConfirmBtn: {
        padding: '10px 20px', background: '#f3f4f6', border: 'none',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#374151',
    },
    confirmDeleteBtn: {
        padding: '10px 20px', background: '#dc2626', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
    },
    toast: {
        position: 'fixed', top: '24px', right: '24px', zIndex: 2000,
        padding: '14px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
    toastSuccess: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
    toastError: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
};

export default StudentList;