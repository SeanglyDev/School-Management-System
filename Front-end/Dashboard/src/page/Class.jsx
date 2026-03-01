import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { API_URL } from '../API/config';

const ANIM_MS = 300;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const blankForm = {
    name: '',
    code: '',
    description: '',
    room: '',
    dayOfWeek: 'Mon',
    startTime: '',
    endTime: '',
};

const Class = () => {
    const [classes, setClasses] = useState([]);
    const [form, setForm] = useState(() => ({ ...blankForm }));
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const [animateClose, setAnimateClose] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const toggleOverlay = (show) => {
        if ($?.LoadingOverlay) {
            $.LoadingOverlay(show ? 'show' : 'hide', { image: '', fontawesome: 'fa fa-cog fa-spin' });
        }
    };

    const fetchClasses = useCallback(async () => {
        toggleOverlay(true);
        try {
            const res = await axios.get(`${API_URL}/class`);
            setClasses(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Unable to fetch classes right now.');
        } finally {
            toggleOverlay(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const openModal = (cls = null) => {
        if (cls) {
            setIsEditing(true);
            setEditingId(cls._id);
            setForm({
                name: cls.name || '',
                code: cls.code || '',
                description: cls.description || '',
                room: cls.room || '',
                dayOfWeek: cls.schedule?.dayOfWeek || 'Mon',
                startTime: cls.schedule?.startTime || '',
                endTime: cls.schedule?.endTime || '',
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setForm({ ...blankForm });
        }
        setAnimateClose(false);
        setModalOpen(true);
        setAnimateIn(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
    };

    const closeModal = () => {
        setAnimateIn(false);
        setAnimateClose(true);
        setTimeout(() => {
            setModalOpen(false);
            setAnimateClose(false);
            setIsEditing(false);
            setEditingId(null);
            setForm({ ...blankForm });
        }, ANIM_MS);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.code || !form.description || !form.room || !form.startTime || !form.endTime) {
            Swal.fire('Missing data', 'Please fill out every required field.', 'warning');
            return;
        }
        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim(),
            room: form.room.trim(),
            schedule: {
                dayOfWeek: form.dayOfWeek,
                startTime: form.startTime,
                endTime: form.endTime,
            },
        };
        setSubmitting(true);
        try {
            let res;
            if (isEditing && editingId) {
                res = await axios.put(`${API_URL}/class/${editingId}`, payload);
                setClasses((prev) => prev.map((cls) => (cls._id === editingId ? res.data : cls)));
                Swal.fire({ icon: 'success', title: 'Class updated', timer: 1400, showConfirmButton: false });
            } else {
                res = await axios.post(`${API_URL}/class`, payload);
                setClasses((prev) => [res.data, ...prev]);
                Swal.fire({ icon: 'success', title: 'Class added', timer: 1400, showConfirmButton: false });
            }
            closeModal();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Unable to save class.';
            Swal.fire('Error', message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (cls) => {
        if (!cls?._id) return;
        const { isConfirmed } = await Swal.fire({
            title: 'Delete class?',
            text: `This will remove ${cls.name || 'the selected class'}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            confirmButtonColor: '#ef4444',
        });
        if (!isConfirmed) return;
        try {
            await axios.delete(`${API_URL}/class/${cls._id}`);
            setClasses((prev) => prev.filter((item) => item._id !== cls._id));
            Swal.fire({ icon: 'success', title: 'Class deleted', timer: 1200, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Unable to delete class.', 'error');
        }
    };

    const renderSchedule = (schedule) => {
        if (!schedule) return '—';
        return `${schedule.dayOfWeek || ''} ${schedule.startTime || ''} - ${schedule.endTime || ''}`.trim();
    };

    const getStudentCount = (cls) => {
        const list = cls?.students;
        if (!list) return 0;
        if (Array.isArray(list)) {
            return list.reduce((count, item) => {
                if (!item) return count;
                if (typeof item === 'string' || typeof item === 'number') return count + 1;
                if (item._id || item.id || item.studentId || item.$oid) return count + 1;
                return count;
            }, 0);
        }
        if (typeof list === 'number') return list;
        if (typeof list === 'object') {
            if (typeof list.length === 'number') return list.length;
            return Object.values(list).filter(Boolean).length;
        }
        return 0;
    };

    return (
        <div className="bg-gray-50 min-h-screen md:ml-64 p-4 sm:p-6 md:p-10 md:mt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase">Classes Management</h1>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition"
                >
                    <Plus size={18} />
                    Add Class
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}



            {modalOpen && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div
                        className={`w-full max-w-xl rounded-lg bg-white shadow-2xl transition-all duration-300 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                            }`}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Class' : 'Add Class'}</h2>
                                <p className="text-sm text-gray-500">{isEditing ? 'Update class information' : 'Provide basic class details'}.</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col text-sm font-medium text-gray-700">
                                    Class name
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                        placeholder="e.g. Algebra I"
                                    />
                                </label>
                                <label className="flex flex-col text-sm font-medium text-gray-700">
                                    Code
                                    <input
                                        name="code"
                                        value={form.code}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 uppercase tracking-wide text-gray-900 focus:border-indigo-500 focus:outline-none"
                                        placeholder="ALG-101"
                                    />
                                </label>
                            </div>
                            <label className="flex flex-col text-sm font-medium text-gray-700">
                                Description
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    placeholder="Short summary about the class"
                                />
                            </label>
                            <div className="grid gap-4 md:grid-cols-3">
                                <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-1">
                                    Room
                                    <input
                                        name="room"
                                        value={form.room}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                        placeholder="Room 204"
                                    />
                                </label>
                                <label className="flex flex-col text-sm font-medium text-gray-700">
                                    Day
                                    <select
                                        name="dayOfWeek"
                                        value={form.dayOfWeek}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    >
                                        {DAYS.map((day) => (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col text-sm font-medium text-gray-700">
                                    Start
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={form.startTime}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </label>
                                <label className="flex flex-col text-sm font-medium text-gray-700">
                                    End
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={form.endTime}
                                        onChange={handleChange}
                                        className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </label>
                            </div>
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
                                    {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="bg-white shadow rounded-lg">
                <div className="md:hidden space-y-4 p-4">
                    {classes.length === 0 ? (
                        <p className="py-6 text-center text-gray-500">
                            No classes yet. Tap &quot;Add Class&quot; to start.
                        </p>
                    ) : (
                        classes.map((cls) => (
                            <div
                                key={cls._id}
                                className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/60 p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">{cls.name}</p>
                                        <p className="text-[11px] uppercase tracking-widest text-indigo-500">
                                            {cls.code?.toUpperCase()}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-600 shadow-sm">
                                        {getStudentCount(cls)} students
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-gray-600">{cls.description}</p>
                                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-800">
                                    <div className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                                        <span className="text-xs uppercase tracking-wide">Room</span>
                                        <span className="font-semibold">{cls.room || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                                        <span className="text-xs uppercase tracking-wide">Schedule</span>
                                        <span className="font-semibold">{renderSchedule(cls.schedule)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => openModal(cls)}
                                        type='button'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleDelete(cls)}
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
                        <thead className=" uppercase text-center bg-indigo-200">
                            <tr>
                                <th className="py-3 px-4 text-left">Class Name</th>
                                <th className="py-3 px-4 text-left">Code</th>
                                <th className="py-3 px-4 text-left">Description</th>
                                <th className="py-3 px-4 text-left">Room</th>
                                <th className="py-3 px-4 text-left">Students</th>
                                <th className="py-3 px-4 text-left">Schedule</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-10 text-center text-gray-500">
                                        No classes yet. Click &quot;Add Class&quot; to get started.
                                    </td>
                                </tr>
                            ) : (
                                classes.map((cls) => (
                                    <tr key={cls._id} className="border-t border-gray-100 hover:bg-indigo-50/50">
                                        <td className="py-4 px-4 font-semibold text-gray-900">{cls.name}</td>
                                        <td className="py-4 px-4 text-gray-700">{cls.code?.toUpperCase()}</td>
                                        <td className="py-4 px-4 text-gray-600">{cls.description}</td>
                                        <td className="py-4 px-4 text-gray-700">{cls.room}</td>
                                        <td className="py-4 px-4 text-gray-700">{getStudentCount(cls)}</td>
                                        <td className="py-4 px-4 text-gray-700">{renderSchedule(cls.schedule)}</td>
                                        <td className="py-3 px-4 space-x-2">
                                            <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                                onClick={() => openModal(cls)}
                                                type='button'
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                onClick={() => handleDelete(cls)}
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
        </div>
    );
};

export default Class;
