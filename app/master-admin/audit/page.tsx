'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    adminName: string;
    createdAt: string;
}

export default function MasterAdminAudit() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/master-admin/audit');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-400';
        if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-400';
        if (action.includes('UPDATE') || action.includes('TOGGLE')) return 'text-yellow-400';
        return 'text-gray-400';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('DELETE') || action.includes('REMOVE')) return '🗑️';
        if (action.includes('CREATE') || action.includes('ADD')) return '➕';
        if (action.includes('UPDATE') || action.includes('TOGGLE')) return '✏️';
        if (action.includes('CLOSE')) return '🛑';
        if (action.includes('LOGIN')) return '🔐';
        return '📋';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <p className="text-gray-400 mt-1">Track all administrative actions on the platform</p>
            </div>

            {/* Logs Timeline */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                {logs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No audit logs yet</p>
                        <p className="text-gray-600 text-sm mt-1">Administrative actions will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg">
                                <div className="text-2xl">{getActionIcon(log.action)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400 text-sm">{log.entityType}</span>
                                    </div>
                                    <div className="text-gray-500 text-sm mt-1">
                                        by {log.adminName} • {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                    {log.details && (
                                        <div className="text-gray-600 text-xs mt-2 font-mono bg-gray-800 p-2 rounded">
                                            {JSON.stringify(log.details, null, 2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
