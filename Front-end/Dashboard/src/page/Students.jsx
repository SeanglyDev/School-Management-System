import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import $ from 'jquery';
import Swal from 'sweetalert2';
import { API_URL } from '../API/config';


const ANIM_MS = 300; // popup animation duration

const Students = () => {
    const [students, setStudents] = useState([]);
    const [classLookup, setClassLookup] = useState({});
    const [error, setError] = useState(null);
    // popup state
    const [openAddStudent, setOpenAddStudent] = useState(false);
    const [animateClose, setAnimateClose] = useState(false);
    const [animateIn, setAnimateIn] = useState(false); // add modal animation
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAnimateClose, setEditAnimateClose] = useState(false);
    const [editAnimateIn, setEditAnimateIn] = useState(false); // edit modal animation

    // insert data to Database (not used in current code)
    const [profile, setProfile] = useState(null);
    const [existingProfile, setExistingProfile] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [classId, setClassId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [isActive, setIsActive] = useState(true);
    // edit 
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);



    const fetchStudentsAndClasses = useCallback(async (withLoader = true) => {
        if (withLoader) {
            $.LoadingOverlay('show', { image: '', fontawesome: 'fa fa-cog fa-spin' });
        }
        try {
            const [studentRes, classRes] = await Promise.all([
                axios.get(`${API_URL}/students`),
                axios.get(`${API_URL}/class`), // keep your route
            ]);
            const lookup = classRes.data.reduce((acc, cls) => {
                acc[String(cls._id)] = cls.name;
                return acc;
            }, {});

            setStudents(studentRes.data);
            setClassLookup(lookup);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Unable to load students/classes');
        } finally {
            if (withLoader) {
                $.LoadingOverlay('hide');
            }
        }
    }, []);
    useEffect(() => {
        fetchStudentsAndClasses();
    }, [fetchStudentsAndClasses]);

    if (error) {
        return (
            <div className="bg-gray-50 min-h-screen md:ml-64 p-4 sm:p-6 md:p-10 mt-16 md:mt-0">
                <div className="text-red-600 font-semibold">{error}</div>
            </div>
        );
    }
    // popup handlers
    const handleOpen = () => {
        setAnimateClose(false);
        setOpenAddStudent(true);
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
            setOpenAddStudent(false);
            setAnimateClose(false);
        }, ANIM_MS);
    };

    const openEditModal = () => {
        setEditAnimateClose(false);
        setShowEditModal(true);
        setEditAnimateIn(false);
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setEditAnimateIn(true))
        );
    };

    const closeEditModal = () => {
        setEditAnimateIn(false);
        setEditAnimateClose(true);
        setTimeout(() => {
            setShowEditModal(false);
            setEditAnimateClose(false);
            resetForm();
        }, ANIM_MS);
    };

    const handleEdit = (student) => {
        if (!student) return;
        setIsEditing(true);
        setEditingId(student._id || null);
        setProfile(null);
        setExistingProfile(student.profile || '');
        setName(student.name || '');
        setAge(student.age?.toString() || '');
        setGender(student.gender || '');
        setEmail(student.email || '');
        const derivedClassId = student.classId?.name ? student.classId._id : (student.classId?.$oid ?? student.classId ?? '');
        setClassId(derivedClassId);
        setPhoneNumber(student.phoneNumber || '');
        setDateOfBirth(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '');
        setIsActive(student.isActive ?? true);
        openEditModal();
    };
    const resetForm = () => {
        setProfile(null);
        setExistingProfile('');
        setName('');
        setAge('');
        setGender('');
        setEmail('');
        setClassId('');
        setPhoneNumber('');
        setDateOfBirth('');
        setIsActive(true);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDeleteStudent = async (student) => {
        if (!student?._id) return;

        const { isConfirmed } = await Swal.fire({
            title: 'Delete this student?',
            text: `This will permanently delete ${student.name || 'the selected student'}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
        });

        if (!isConfirmed) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/students/${student._id}`);
            setStudents((prev) => prev.filter((stu) => stu._id !== student._id));
            Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Student deleted',
                showConfirmButton: false,
                timer: 1400,
            });
        } catch (error) {
            console.error('Error deleting student:', error);
            Swal.fire('Error', 'There was an error deleting the student.', 'error');
        }
    };
    const handleFormSubmit = async (e) => {

        e.preventDefault();
        try {
            const formData = new window.FormData();
            if (profile) formData.append('profile', profile);
            formData.append('name', name);
            formData.append('age', age);
            formData.append('gender', gender);
            formData.append('email', email);
            formData.append('classId', classId);
            formData.append('phoneNumber', phoneNumber);
            formData.append('dateOfBirth', dateOfBirth);
            formData.append('isActive', isActive);

            if (isEditing) {
                await axios.put(`${API_URL}/students/${editingId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                await fetchStudentsAndClasses(false);
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "User updated",
                    showConfirmButton: false,
                    timer: 1400,
                });
                closeEditModal();
            } else {
                await axios.post(`${API_URL}/students`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                await fetchStudentsAndClasses(false);
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "User added successfully",
                    showConfirmButton: false,
                    timer: 1500,
                });
                resetForm();
                handleClose();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire('Error', 'There was an error submitting the form.', 'error');
        } finally {
            $.LoadingOverlay('hide');
        }
    };

    const renderClassName = (student) => {
        const classKey = student.classId?.name
            ? student.classId._id
            : student.classId?.$oid ?? student.classId;

        return (
            student.classId?.name ??
            classLookup[String(classKey)] ??
            'Unknown class'
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen md:ml-64 p-4 sm:p-6 md:p-10  md:mt-0">
            <div className="flex flex-col  gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-2xl font-bold uppercase">Students Management</h1>
                <button
                    className=" md:self-start sm:self-auto bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
                    onClick={handleOpen}
                >
                    Add Student
                </button>
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-indigo-100 text-indigo-900 text-sm md:text-base font-semibold tracking-wide">
                    <thead className="uppercase text-center bg-indigo-200">
                        <tr className=''>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Profile</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Name</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Age</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Gender</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Email</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Class</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Phone</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">DayOfBirth</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Active</th>
                            <th className="py-3 px-4 border-b border-indigo-200 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student._id}>
                                <td className="py-3 px-4">
                                    <img
                                        src={student.profile ? `http://localhost:3000/uploadStudents/${student.profile}` : ""}
                                        alt={student.name}
                                        className="w-[55px] h-[55px] object-cover mx-auto rounded-full"
                                    />
                                </td>
                                <td className="py-3 px-4">{student.name}</td>
                                <td className="py-3 px-4">{student.age}</td>
                                <td className="py-3 px-4 capitalize">{student.gender}</td>
                                <td className="py-3 px-4 truncate max-w-xs">{student.email}</td>
                                <td className="py-3 px-4">{renderClassName(student)}</td>
                                <td className="py-3 px-4">{student.phoneNumber}</td>
                                <td className="py-3 px-4">
                                    {new Date(student.dateOfBirth).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">{student.isActive ? 'Yes' : 'No'}</td>
                                <td className="py-3 px-4 space-x-2">
                                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleEdit(student)}
                                        type='button'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleDeleteStudent(student)}
                                        type='button'
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
                {students.map((student) => (
                    <div key={student._id} className="bg-white rounded-lg shadow p-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <img
                                src={student.profile ? `http://localhost:3000/uploadStudents/${student.profile}` : ""}
                                alt={student.name}
                                className="w-[55px] h-[55px] object-cover mx-auto rounded-full"
                            />
                            <span className="text-indigo-600 font-semibold">{`ClassName ${renderClassName(student)}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">{student.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                            <span>Age: {student.age}</span>
                            <span>Gender: {student.gender}</span>
                            <span>Phone: {student.phoneNumber}</span>
                            <span>Birth: {new Date(student.dateOfBirth).toLocaleDateString()}</span>
                            <span className="col-span-2">Email: {student.email}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-sm font-medium">
                                Active: {student.isActive ? 'Yes' : 'No'}
                            </span>
                            <div className="space-x-2">
                                <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                                    onClick={() => handleEdit(student)}
                                >Edit</button>
                                <button
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    onClick={() => handleDeleteStudent(student)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Student Modal — popup-only changes */}
            {openAddStudent && (
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
                        aria-labelledby="add-student-title"
                    >
                        <h2 id="add-student-title" className="text-xl font-bold mb-4">
                            Add Student
                        </h2>
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            <X />
                        </button>
                        {/* Your form fields go here */}
                        <div className="text-gray-600">
                            <form onSubmit={handleFormSubmit}>
                                {/* placeholder content; replace with your actual add-student form */}
                                <div>
                                    <label className='font-bold'>Profile</label>
                                    <div className='flex items-center gap-4'>
                                        {(existingProfile || profile) && (
                                            <img
                                                src={
                                                    profile
                                                        ? URL.createObjectURL(profile)
                                                        : existingProfile
                                                            ? `http://localhost:3000/uploadStudents/${existingProfile}`
                                                            : ""
                                                }
                                                alt="preview"
                                                className="w-[55px] h-[55px] object-cover rounded-full border"
                                            />
                                        )}

                                        <input type="file"
                                            accept='image/*'
                                            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                            onChange={(e) => setProfile(e.target.files[0])}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='font-bold'>Name</label>
                                    <input type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter name"
                                        onChange={(e) => setName(e.target.value)}
                                        value={name} />
                                </div>
                                <div>
                                    <label className='font-bold'>Age</label>
                                    <input type="number"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter age"
                                        onChange={(e) => setAge(e.target.value)}
                                        value={age} />
                                </div>
                                <div>
                                    <label className='font-bold'>Gender</label>
                                    <select
                                        onChange={(e) => setGender(e.target.value)}
                                        value={gender}
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-bold'>Email</label>
                                    <input type="email"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        value={email} />
                                </div>
                                <div>
                                    <label className='font-bold'>Class</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setClassId(e.target.value)}
                                        value={classId}
                                    >
                                        <option value="">Select class</option>
                                        {Object.entries(classLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='font-bold'>Phone Number</label>
                                    <input type="tel"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter phone number"
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        value={phoneNumber} />
                                </div>
                                <div>
                                    <label className='font-bold'>Date of Birth</label>
                                    <input type="date"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        value={dateOfBirth} />
                                </div>
                                <div>
                                    <label className='font-bold'>Active</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setIsActive(e.target.value === 'true')}
                                        value={isActive.toString()}
                                    >
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        type='submit'
                                        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"

                                    >
                                        Save Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Student modal with smooth animation */}
            {showEditModal && (
                <div
                    className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ease-out duration-${ANIM_MS} ${editAnimateIn && !editAnimateClose ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeEditModal}
                >
                    <div
                        className={`bg-white rounded-lg shadow-lg w-11/12 md:w-[1000px] p-6 relative transform transition-transform ease-out duration-${ANIM_MS} ${editAnimateIn && !editAnimateClose ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-student-title"
                    >
                        <h2 id="edit-student-title" className="text-xl font-bold mb-4">
                            Edit Student
                        </h2>
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                            onClick={closeEditModal}
                            aria-label="Close edit modal"
                        >
                            <X />
                        </button>
                        <form onSubmit={handleFormSubmit}>
                            <div>
                                <label className='font-bold'>Profile</label>
                                <div className='flex items-center gap-4'>
                                    {(existingProfile || profile) && (
                                        <img
                                            src={
                                                profile
                                                    ? URL.createObjectURL(profile)
                                                    : existingProfile
                                                        ? `http://localhost:3000/uploadStudents/${existingProfile}`
                                                        : ""
                                            }
                                            alt="preview"
                                            className="w-[55px] h-[55px] object-cover rounded-full border"
                                        />
                                    )}

                                    <input type="file"
                                        accept='image/*'
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setProfile(e.target.files[0])}
                                    />
                                </div>
                                <div>
                                    <label className='font-bold'>Name</label>
                                    <input type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter name"
                                        onChange={(e) => setName(e.target.value)}
                                        value={name} />
                                </div>
                                <div>
                                    <label className='font-bold'>Age</label>
                                    <input type="number"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter age"
                                        onChange={(e) => setAge(e.target.value)}
                                        value={age} />
                                </div>
                                <div>
                                    <label className='font-bold'>Gender</label>
                                    <select
                                        onChange={(e) => setGender(e.target.value)}
                                        value={gender}
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-bold'>Email</label>
                                    <input type="email"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        value={email} />
                                </div>
                                <div>
                                    <label className='font-bold'>Class</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setClassId(e.target.value)}
                                        value={classId}
                                    >
                                        <option value="">Select class</option>
                                        {Object.entries(classLookup).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='font-bold'>Phone Number</label>
                                    <input type="tel"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        placeholder="Enter phone number"
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        value={phoneNumber} />
                                </div>
                                <div>
                                    <label className='font-bold'>Date of Birth</label>
                                    <input type="date"
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        value={dateOfBirth} />
                                </div>
                                <div>
                                    <label className='font-bold'>Active</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1 mb-4"
                                        onChange={(e) => setIsActive(e.target.value === 'true')}
                                        value={isActive.toString()}
                                    >
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        type='submit'
                                        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
                                    >
                                        Update Student
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div >
    );
};
export default Students;
