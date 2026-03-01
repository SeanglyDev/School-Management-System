import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../API/config';
import $ from 'jquery';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';

const ANIM_MS = 300;
const TEACHER_UPLOAD_BASE = 'http://localhost:3000/uploadTeacher';

function Teachers() {
    // Popup state
    const [openTeacher, setOpenTeacher] = useState(false);
    const [animateClose, setAnimateClose] = useState(false);
    const [animateIn, setAnimateIn] = useState(false); // add modal animation
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAnimateClose, setEditAnimateClose] = useState(false);
    const [editAnimateIn, setEditAnimateIn] = useState(false); // edit modal animation
    // Lookup states
    const [classLookup, setClassLookup] = useState({});
    const [subjectsLookup, setSubjectsLookup] = useState({});
    const [teachers, setTeachers] = useState([]);
    // form state
    const [profile, setProfile] = useState(null);
    const [profilePreview, setProfilePreview] = useState('');
    const [existingProfile, setExistingProfile] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [classId, setClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);


    useEffect(() => {
        if (profile) {
            const objectUrl = URL.createObjectURL(profile);
            setProfilePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
        if (existingProfile) {
            setProfilePreview(`${TEACHER_UPLOAD_BASE}/${existingProfile}`);
        } else {
            setProfilePreview('');
        }
    }, [profile, existingProfile]);

    const resetForm = () => {
        setProfile(null);
        setProfilePreview('');
        setExistingProfile('');
        setFullName('');
        setEmail('');
        setPhone('');
        setClassId('');
        setSubjectId('');
        setIsActive(true);
    };
    // fetch teachers with class and subject lookups
    const fetchTeachers = useCallback(async (withLoader = true) => {
        if (withLoader) {
            $.LoadingOverlay('show', { image: '', fontawesome: 'fa fa-cog fa-spin' });
        }
        try {
            const [teachersRes, classRes, subjectRes] = await Promise.all([
                axios.get(`${API_URL}/teachers`),
                axios.get(`${API_URL}/class`),
                axios.get(`${API_URL}/subject`)
            ]);

            const classMap = classRes.data.reduce((acc, cls) => {
                const id = cls._id || cls.id;
                if (id) acc[String(id)] = cls.name || cls.title || 'Unnamed class';
                return acc;
            }, {});

            const subjectMap = subjectRes.data.reduce((acc, subject) => {
                const id = subject._id || subject.id;
                if (id) acc[String(id)] = subject.name || subject.title || 'Unnamed subject';
                return acc;
            }, {});

            const teachersWithLookups = teachersRes.data.map((teacher) => ({
                ...teacher,
                className: classMap[String(teacher.classId?._id || teacher.classId?.$oid || teacher.classId)] || 'Unknown',
                subjectName: subjectMap[String(teacher.subjectId?._id || teacher.subjectId?.$oid || teacher.subjectId)] || 'Unknown',
            }));

            setClassLookup(classMap);
            setSubjectsLookup(subjectMap);
            setTeachers(teachersWithLookups);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            if (withLoader) {
                $.LoadingOverlay('hide');
            }
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleOpen = () => {
        resetForm();
        setAnimateClose(false);
        setOpenTeacher(true);
        setAnimateIn(false);
        // paint hidden first, then animate in
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setAnimateIn(true))
        );
    };

    const handleClose = () => {
        setAnimateIn(false); // reverse animation
        setAnimateClose(true);
        setTimeout(() => {
            setOpenTeacher(false);
            setAnimateClose(false);
            resetForm();
        }, ANIM_MS);
    }
    const handleEditOpen = (teacher) => {
        if (!teacher) return;
        setFullName(teacher.fullName || teacher.name || '');
        setEmail(teacher.email || '');
        setPhone(teacher.phone || '');
        const derivedClassId = teacher.classId?._id || teacher.classId?.$oid || teacher.classId || '';
        const derivedSubjectId = teacher.subjectId?._id || teacher.subjectId?.$oid || teacher.subjectId || '';
        setClassId(String(derivedClassId));
        setSubjectId(String(derivedSubjectId));
        setIsActive(Boolean(teacher.isActive));
        setProfile(null);
        setExistingProfile(teacher.profile || '');
        setEditAnimateClose(false);
        setShowEditModal(true);
        setEditAnimateIn(false);
        // paint hidden first, then animate in
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setEditAnimateIn(true))
        );
    }
    const handleEditClose = () => {
        setEditAnimateIn(false);
        setEditAnimateClose(true);
        setTimeout(() => {
            setShowEditModal(false);
            setEditAnimateClose(false);
            resetForm();
        }, ANIM_MS);
    };
    const handleDelete = async (teacher) => {
        try {
            const teacherId = teacher?._id || teacher?.id;
            if (!teacherId) return;
            const { isConfirmed } = await Swal.fire({
                title: 'Delete this teacher?',
                text: `This will permanently delete ${teacher.fullName || teacher.name || 'the selected teacher'}.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
            });
            if (!isConfirmed) {
                return;
            }

            setDeletingId(String(teacherId));
            await axios.delete(`${API_URL}/teachers/${teacherId}`);
            setTeachers((prev => prev.filter((th) => (th._id || th.id) !== teacherId)));
            Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Teacher deleted',
                showConfirmButton: false,
                timer: 1400,
            });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            Swal.fire('Error', 'There was an error deleting the teacher.', 'error');
        } finally {
            setDeletingId(null);
        }

    }
    const renderClass = (value) => {
        const classKey = value?._id || value?.$oid || value;
        return classLookup[String(classKey)] || 'Unknown';
    };
    const renderSubject = (value) => {
        const subjectKey = value?._id || value?.$oid || value;
        return subjectsLookup[String(subjectKey)] || 'Unknown';
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new window.FormData();
            if (profile) formData.append('profile', profile);
            formData.append('fullName', fullName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('classId', classId);
            formData.append('subjectId', subjectId);
            formData.append('isActive', isActive);
            if (isEditing) {
                await axios.put(`${API_URL}/teachers${editingId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                })
                await fetchTeachers(false)
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "User updated",
                    showConfirmButton: false,
                    timer: 1400,
                });
                closeEditModal();
            } else {
                await axios.post(`${API_URL}/teachers`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                await fetchTeachers(false);
                Swal.fire('Success', 'Teacher added successfully', 'success');
                handleClose();
            }
        } catch (error) {
            console.error('Error saving teacher:', error);
            const message = error?.response?.data?.message || 'Unable to save teacher';
            Swal.fire('Error', message, 'error');
        } finally {
            $.LoadingOverlay('hide');
        }
    };
    return (
        <div className="bg-gray-50 min-h-screen md:ml-64 p-4 sm:p-6 md:p-10 md:mt-0">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold mb-4 uppercase">Teachers Management</h1>
                <div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
                        onClick={handleOpen}>
                        Add Teacher
                    </button>
                </div>
            </div>
            <div className="hidden md:block overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-indigo-100 text-indigo-900 text-sm md:text-base font-semibold tracking-wide">
                    <thead className="uppercase text-center bg-indigo-200">
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Profile</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Name</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Email</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Phone Number</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Subject</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Class</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Active</th>
                            <th className="py-2 px-4 border-b border-gray-200 text-left">Action</th>

                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {teachers.map((teacher) => (
                            <tr key={teacher.id || teacher._id} className="hover:bg-indigo-50">
                                <td className="py-2 px-4 border-b border-gray-200 text-left">
                                    {teacher.profile ? (
                                        <img
                                            src={`${TEACHER_UPLOAD_BASE}/${teacher.profile}`}
                                            alt={teacher.fullName || teacher.name}
                                            className="w-[55px] h-[55px] object-cover mx-auto rounded-full"
                                        />
                                    ) : (
                                        <div className="w-[55px] h-[55px] rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                                            {(teacher.fullName || teacher.name || '?').charAt(0)}
                                        </div>
                                    )}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">{teacher.fullName || teacher.name}</td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">{teacher.email}</td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">{teacher.phone}</td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">
                                    {renderSubject(teacher.subjectId)}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">
                                    {renderClass(teacher.classId)}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left">
                                    {teacher.isActive ? 'Yes' : 'No'}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-left space-x-2">
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleEditOpen(teacher)}
                                        type='button'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        onClick={() => handleDelete(teacher)}
                                        type='button'
                                        disabled={deletingId === String(teacher._id || teacher.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* show Mobile */}
            <div>
                <h2 className="text-xl font-bold mb-4 md:hidden">Teachers List</h2>
                <div className="space-y-4 md:hidden">
                    {teachers.map((teacher) => (
                        <div key={teacher.id || teacher._id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center space-x-4 mb-4">
                                {teacher.profile ? (
                                    <img
                                        src={`${TEACHER_UPLOAD_BASE}/${teacher.profile}`}
                                        alt={teacher.fullName || teacher.name}
                                        className="w-[55px] h-[55px] object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="w-[55px] h-[55px] rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                                        {(teacher.fullName || teacher.name || '?').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p><span className="font-semibold">Name:</span> {teacher.fullName || teacher.name}</p>
                                <p><span className="font-semibold">Email:</span> {teacher.email}</p>
                                <p><span className="font-semibold">Phone Number:</span> {teacher.phone}</p>
                                <p><span className="font-semibold">Subject:</span> {renderSubject(teacher.subjectId)}</p>
                                <p><span className="font-semibold">Class:</span> {renderClass(teacher.classId)}</p>
                                <p><span className="font-semibold">Active:</span> {teacher.isActive ? 'Yes' : 'No'}</p>
                                <div className="mt-4 space-x-2">
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                        type='button'
                                        onClick={() => handleEditOpen(teacher)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        onClick={() => handleDelete(teacher)}
                                        type='button'
                                        disabled={deletingId === String(teacher._id || teacher.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* // form popup add teacher */}
            {openTeacher && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center
                      bg-black/50 backdrop-blur-sm
                      transition-opacity ease-out duration-${ANIM_MS}
                      ${animateIn && !animateClose ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleClose}
                >
                    <div
                        className={`bg-white rounded-lg shadow-lg w-11/12 md:w-[1000px] p-6 relative
                        transform transition-transform ease-out duration-${ANIM_MS}
                        ${animateIn && !animateClose
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-teacher-title"
                    >

                        <h2 id="add-teacher-title" className="text-xl font-bold mb-4">
                            Add Teacher
                        </h2>
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            <X />
                        </button>
                        <form onSubmit={handleFormSubmit} className="space-y-4 text-gray-700">
                            <div>
                                <label className="font-semibold">Profile</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="w-[70px] h-[70px] rounded-full border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No image</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                                        onChange={(e) => setProfile(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                    placeholder="Enter full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        placeholder="Enter email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        placeholder="Enter phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold">Subject</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select subject</option>
                                        {Object.entries(subjectsLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold">Class</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        value={classId}
                                        onChange={(e) => setClassId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select class</option>
                                        {Object.entries(classLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold">Active</label>
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                    value={isActive.toString()}
                                    onChange={(e) => setIsActive(e.target.value === 'true')}
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                                >
                                    Save Teacher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* // form popup edit teacher */}
            {showEditModal && (
                <div
                    className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ease-out duration-${ANIM_MS} ${editAnimateIn && !editAnimateClose ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleEditClose}
                >

                    <div
                        className={`bg-white rounded-lg shadow-lg w-11/12 md:w-[1000px] p-6 relative
                        transform transition-transform ease-out duration-${ANIM_MS}
                        ${editAnimateIn && !editAnimateClose
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-teacher-title"
                    >
                        <h2 id="edit-teacher-title" className="text-xl font-bold mb-4">
                            Edit Teacher
                        </h2>
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                            onClick={handleEditClose}
                            aria-label="Close"
                        >
                            <X />
                        </button>
                        <form onSubmit={handleFormSubmit} className="space-y-4 text-gray-700">
                            <div>
                                <label className="font-semibold">Profile</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="w-[70px] h-[70px] rounded-full border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No image</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                                        onChange={(e) => setProfile(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                    placeholder="Enter full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        placeholder="Enter email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        placeholder="Enter phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold">Subject</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select subject</option>
                                        {Object.entries(subjectsLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold">Class</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                        value={classId}
                                        onChange={(e) => setClassId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select class</option>
                                        {Object.entries(classLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold">Active</label>
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                    value={isActive.toString()}
                                    onChange={(e) => setIsActive(e.target.value === 'true')}
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                                >
                                    Save Teacher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>);
}
export default Teachers
