import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { API_URL } from '../API/config';

const ANIM_MS = 300;
const blankForm = {
    name: '',
    code: '',
    description: '',
};

const Subject = () => {
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState(() => ({ ...blankForm }));
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const toggleOverlay = (show) => {
        if ($?.LoadingOverlay) {
            $.LoadingOverlay(show ? 'show' : 'hide', { image: '', fontawesome: 'fa fa-cog fa-spin' });
        }
    };

    const fetchSubjects = useCallback(async () => {
        toggleOverlay(true);
        try {
            const res = await axios.get(`${API_URL}/subject`);
            setSubjects(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Unable to load subjects right now.');
        } finally {
            toggleOverlay(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const openModal = (subject = null) => {
        if (subject) {
            setIsEditing(true);
            setEditingId(subject._id);
            setForm({
                name: subject.name || '',
                code: subject.code || '',
                description: subject.description || '',
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setForm({ ...blankForm });
        }
        setModalOpen(true);
        setAnimateIn(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
    };

    const closeModal = () => {
        setAnimateIn(false);
        setTimeout(() => {
            setModalOpen(false);
            setForm({ ...blankForm });
            setIsEditing(false);
            setEditingId(null);
        }, ANIM_MS);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.code.trim()) {
            Swal.fire('Missing fields', 'Name and code are required.', 'warning');
            return;
        }
        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim(),
        };
        setSubmitting(true);
        try {
            if (isEditing && editingId) {
                await axios.put(`${API_URL}/subject/${editingId}`, payload);
                await fetchSubjects();
                Swal.fire({ icon: 'success', title: 'Subject updated', timer: 1400, showConfirmButton: false });
            } else {
                await axios.post(`${API_URL}/subject`, payload);
                await fetchSubjects();
                Swal.fire({ icon: 'success', title: 'Subject added', timer: 1400, showConfirmButton: false });
            }
            closeModal();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Unable to save subject.';
            Swal.fire('Error', message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (subject) => {
        if (!subject?._id) return;
        const { isConfirmed } = await Swal.fire({
            title: 'Delete subject?',
            text: `This will remove ${subject.name || 'the selected subject'}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            confirmButtonColor: '#ef4444',
        });
        if (!isConfirmed) return;
        try {
            await axios.delete(`${API_URL}/subject/${subject._id}`);
            setSubjects((prev) => prev.filter((item) => item._id !== subject._id));
            Swal.fire({ icon: 'success', title: 'Subject deleted', timer: 1200, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Unable to delete subject.', 'error');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen md:ml-64 p-4 sm:p-6 md:p-10 md:mt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase ">Subjects Management</h1>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition"
                >
                    <Plus size={18} />
                    Add Subject
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg">
                <div className="md:hidden space-y-4 p-4">
                    {subjects.length === 0 ? (
                        <p className="py-6 text-center text-gray-500">
                            No subjects yet. Tap &quot;Add Subject&quot; to start.
                        </p>
                    ) : (
                        subjects.map((subject) => (
                            <div
                                key={subject._id}
                                className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/60 p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">{subject.name}</p>
                                        <p className="text-[11px] uppercase tracking-widest text-indigo-500">
                                            {subject.code?.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-600">{subject.description || 'No description yet.'}</p>
                                <div className="py-3 px-4 space-x-2">
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => openModal(subject)}
                                        type='button'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleDelete(subject)}
                                        type='button'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full bg-indigo-100 text-indigo-900 text-sm md:text-base font-semibold tracking-wide">
                        <thead className="uppercase text-center bg-indigo-200">
                            <tr>
                                <th className="py-3 px-4 text-left">Subject Name</th>
                                <th className="py-3 px-4 text-left">Code</th>
                                <th className="py-3 px-4 text-left">Description</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-gray-500">
                                        No subjects yet. Click &quot;Add Subject&quot; to get started.
                                    </td>
                                </tr>
                            ) : (
                                subjects.map((subject) => (
                                    <tr key={subject._id} className="border-t border-gray-100 hover:bg-indigo-50/50">
                                        <td className="py-4 px-4 font-semibold text-gray-900">{subject.name}</td>
                                        <td className="py-4 px-4 text-gray-700">{subject.code?.toUpperCase()}</td>
                                        <td className="py-4 px-4 text-gray-600">{subject.description || '—'}</td>
                                        <td className="py-3 px-4 space-x-2">
                                            <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                                onClick={() => openModal(subject)}
                                                type='button'
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                onClick={() => handleDelete(subject)}
                                                type='button'
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div
                        className={`w-full max-w-lg rounded-lg bg-white shadow-2xl transition-all duration-300 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                            }`}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Subject' : 'Add Subject'}</h2>
                                <p className="text-sm text-gray-500">
                                    {isEditing ? 'Update subject details below.' : 'Provide the basic subject information.'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                            <label className="flex flex-col text-sm font-medium text-gray-700">
                                Subject name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    placeholder="e.g. Physics"
                                />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-gray-700">
                                Code
                                <input
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    className="mt-1 rounded-md border border-gray-200 px-3 py-2 uppercase tracking-wide text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    placeholder="PHY-200"
                                />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-gray-700">
                                Description
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    placeholder="Short summary about the subject"
                                />
                            </label>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subject;
