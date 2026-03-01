import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { API_URL } from '../API/config';

const RESOURCES = [
    { key: 'students', label: 'Students', endpoint: '/students', color: '#4F46E5' },
    { key: 'teachers', label: 'Teachers', endpoint: '/teachers', color: '#22C55E' },
    { key: 'class', label: 'Classes', endpoint: '/class', color: '#F97316' },
    { key: 'subject', label: 'Subjects', endpoint: '/subject', color: '#0EA5E9' },
];

const Chart = () => {
    const [chartData, setChartData] = useState(() =>
        RESOURCES.map((resource) => ({
            name: resource.label,
            total: 0,
            fill: resource.color,
        }))
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const responses = await Promise.all(
                RESOURCES.map((resource) => axios.get(`${API_URL}${resource.endpoint}`))
            );
            const normalized = responses.map((res, index) => {
                const resource = RESOURCES[index];
                const payload = res.data;
                const total = Array.isArray(payload)
                    ? payload.length
                    : Number(payload?.count ?? payload?.length ?? 0);
                return {
                    name: resource.label,
                    total,
                    fill: resource.color,
                };
            });
            setChartData(normalized);
        } catch (err) {
            console.error('Unable to load chart data:', err);
            setError('Unable to load dashboard metrics. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 uppercase">School Overview</h3>
                    <p className="text-sm text-gray-500">Live counts fetched from the API.</p>
                </div>
                <button
                    onClick={fetchCounts}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>
            {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </div>
            ) : (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={200}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(79,70,229,0.1)' }} />
                            <Bar dataKey="total">
                                {chartData.map((entry) => (
                                    <Cell key={`bar-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {loading && (
                <p className="mt-2 text-xs text-gray-500">
                    Fetching the latest numbers…
                </p>
            )}
        </div>
    );
};

export default Chart;
