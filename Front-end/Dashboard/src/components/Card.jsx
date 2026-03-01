import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import iconProfile from '../assets/icon/students.png';
import iconTeachers from '../assets/icon/teacher.png';
import iconClass from '../assets/icon/class.png';
import iconSubject from '../assets/icon/text-books.png';
import { API_URL } from '../API/config';

const RESOURCES = [
    { key: 'students', label: 'Total Students', endpoint: '/students', icon: iconProfile, accent: 'from-purple-500 to-indigo-600' },
    { key: 'subjects', label: 'Total Subjects', endpoint: '/subject', icon: iconSubject, accent: 'from-pink-500 to-rose-500' },
    { key: 'teachers', label: 'Total Teachers', endpoint: '/teachers', icon: iconTeachers, accent: 'from-blue-500 to-cyan-500' },
    { key: 'classes', label: 'Total Classes', endpoint: '/class', icon: iconClass, accent: 'from-amber-500 to-orange-600' },
];

const Card = () => {
    const [stats, setStats] = useState(() =>
        RESOURCES.reduce((acc, resource) => {
            acc[resource.key] = { total: 0, loading: true };
            return acc;
        }, {})
    );
    const [error, setError] = useState(null);

    const fetchCounts = useCallback(async () => {
        setError(null);
        try {
            const responses = await Promise.all(
                RESOURCES.map((resource) => axios.get(`${API_URL}${resource.endpoint}`))
            );
            const nextStats = {};
            responses.forEach((res, index) => {
                const resource = RESOURCES[index];
                const payload = res.data;
                const total = Array.isArray(payload)
                    ? payload.length
                    : Number(payload?.count ?? payload?.length ?? 0);
                nextStats[resource.key] = { total, loading: false };
            });
            setStats(nextStats);
        } catch (err) {
            console.error('Unable to load counts:', err);
            setError('Unable to load counts right now.');
            setStats((prev) =>
                Object.fromEntries(
                    Object.entries(prev).map(([key, value]) => [key, { ...value, loading: false }])
                )
            );
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const totalPopulation = useMemo(
        () => Object.values(stats).reduce((sum, entry) => sum + (entry?.total ?? 0), 0),
        [stats]
    );

    return (
        <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Overview</p>
                    <h2 className="text-2xl font-semibold text-gray-900">Campus summary</h2>
                    <p className="text-sm text-gray-500">Community size: {totalPopulation || '—'}</p>
                </div>
                <button
                    onClick={fetchCounts}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {RESOURCES.map((resource) => {
                    const entry = stats[resource.key] || { total: 0, loading: true };
                    return (
                        <div
                            key={resource.key}
                            className={`bg-gradient-to-r ${resource.accent} p-6 rounded-2xl shadow-md text-white flex flex-col gap-4`}
                        >
                            <img
                                src={resource.icon}
                                alt={resource.label}
                                className="w-16 h-16 object-contain drop-shadow-lg"
                            />
                            <div>
                                <p className="text-sm uppercase tracking-wide text-white/70">{resource.label}</p>
                                <p className="text-4xl font-bold">
                                    {entry.loading ? '…' : entry.total?.toLocaleString?.() ?? entry.total}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Card;
