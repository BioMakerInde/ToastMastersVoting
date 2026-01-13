'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

export default function CategoriesPage() {
    const { data: session } = useSession();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, [session]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                // API returns { categories: [...] }
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory })
            });

            if (res.ok) {
                setNewCategory('');
                fetchCategories();
            } else {
                alert('Failed to add category');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
            } else {
                alert('Failed to delete (might have existing votes)');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8">Loading categories...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Voting Categories</h1>
                    <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                {/* Add Category Form */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h2>
                    <form onSubmit={handleAddCategory} className="flex gap-4">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g. Best Evaluator"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim()}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </form>
                </div>

                {/* Categories List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {categories.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">No categories found. Add one above!</li>
                        ) : (
                            categories.map((cat) => (
                                <li key={cat.id} className="px-6 py-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
