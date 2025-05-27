import React, { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    CheckCircle,
    Circle,
    Calendar,
    Flame,
    Target,
    Loader2,
} from "lucide-react";

const StreakMaintainer = () => {
    const [streaks, setStreaks] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStreakName, setNewStreakName] = useState("");
    const [newStreakDescription, setNewStreakDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Simulated API calls (since we can't make real HTTP requests in artifacts)
    const mockAPI = {
        getStreaks: () => {
            const saved = JSON.parse(sessionStorage.getItem("streaks") || "[]");
            return Promise.resolve(saved);
        },
        createStreak: (data) => {
            const saved = JSON.parse(sessionStorage.getItem("streaks") || "[]");
            const newStreak = {
                _id: Date.now().toString(),
                name: data.name,
                description: data.description || "",
                currentStreak: 0,
                longestStreak: 0,
                lastCompleted: null,
                completedDates: [],
                createdAt: new Date().toISOString(),
            };
            const updated = [...saved, newStreak];
            sessionStorage.setItem("streaks", JSON.stringify(updated));
            return Promise.resolve(newStreak);
        },
        updateStreak: (id) => {
            const saved = JSON.parse(sessionStorage.getItem("streaks") || "[]");
            const today = new Date().toDateString();

            const updated = saved.map((streak) => {
                if (streak._id !== id) return streak;

                // Check if already completed today
                if (streak.completedDates.includes(today)) return streak;

                const lastCompleted = streak.lastCompleted
                    ? new Date(streak.lastCompleted)
                    : null;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                let newCurrentStreak;
                if (
                    !lastCompleted ||
                    lastCompleted.toDateString() === yesterday.toDateString()
                ) {
                    newCurrentStreak = streak.currentStreak + 1;
                } else {
                    newCurrentStreak = 1;
                }

                return {
                    ...streak,
                    currentStreak: newCurrentStreak,
                    longestStreak: Math.max(
                        streak.longestStreak,
                        newCurrentStreak
                    ),
                    lastCompleted: today,
                    completedDates: [...streak.completedDates, today],
                };
            });

            sessionStorage.setItem("streaks", JSON.stringify(updated));
            return Promise.resolve(updated.find((s) => s._id === id));
        },
        deleteStreak: (id) => {
            const saved = JSON.parse(sessionStorage.getItem("streaks") || "[]");
            const filtered = saved.filter((s) => s._id !== id);
            sessionStorage.setItem("streaks", JSON.stringify(filtered));
            return Promise.resolve();
        },
    };

    // Load streaks on component mount
    useEffect(() => {
        loadStreaks();
    }, []);

    const loadStreaks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/streaks`);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setStreaks(data);
            setError("");
        } catch (err) {
            setError("Failed to load streaks");
            console.error("Error loading streaks:", err);
        } finally {
            setLoading(false);
        }
    };

    const addStreak = async () => {
        if (!newStreakName.trim()) return;

        try {
            const response = await fetch(`${API_BASE_URL}/streaks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newStreakName.trim(),
                    description: newStreakDescription.trim(),
                }),
            });

            if (!response.ok) throw new Error("Failed to create streak");

            const newStreak = await response.json();
            setStreaks((prev) => [...prev, newStreak]);
            setNewStreakName("");
            setNewStreakDescription("");
            setShowAddForm(false);
            setError("");
        } catch (err) {
            setError("Failed to create streak");
            console.error("Error creating streak:", err);
        }
    };

    const deleteStreak = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/streaks/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete streak");

            setStreaks((prev) => prev.filter((streak) => streak._id !== id));
            setError("");
        } catch (err) {
            setError("Failed to delete streak");
            console.error("Error deleting streak:", err);
        }
    };

    const markComplete = async (id) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/streaks/${id}/complete`,
                {
                    method: "PUT",
                }
            );

            if (!response.ok) throw new Error("Failed to update streak");

            const updatedStreak = await response.json();
            setStreaks((prev) =>
                prev.map((streak) =>
                    streak._id === id ? updatedStreak : streak
                )
            );
            setError("");
        } catch (err) {
            setError("Failed to update streak");
            console.error("Error updating streak:", err);
        }
    };

    const isCompletedToday = (streak) => {
        const today = new Date().toDateString();
        return streak.completedDates.includes(today);
    };

    const getStreakStatus = (streak) => {
        if (!streak.lastCompleted) return "new";

        const lastDate = new Date(streak.lastCompleted);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === today.toDateString())
            return "completed";
        if (lastDate.toDateString() === yesterday.toDateString())
            return "active";
        return "broken";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "text-green-600 bg-green-50";
            case "active":
                return "text-blue-600 bg-blue-50";
            case "broken":
                return "text-red-600 bg-red-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const totalActiveStreaks = streaks.filter((s) =>
        ["completed", "active"].includes(getStreakStatus(s))
    ).length;
    const totalCompletedToday = streaks.filter(isCompletedToday).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2
                        className="animate-spin mx-auto mb-4 text-blue-600"
                        size={48}
                    />
                    <p className="text-gray-600">Loading your streaks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                        <Flame className="text-orange-500" size={40} />
                        Streak Maintainer
                    </h1>
                    <p className="text-gray-600">
                        Track your daily habits and build consistency
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center gap-3">
                            <Target className="text-blue-500" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Streaks
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {streaks.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center gap-3">
                            <Flame className="text-orange-500" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Active Streaks
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {totalActiveStreaks}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-500" size={24} />
                            <div>
                                <p className="text-sm text-gray-600">
                                    Completed Today
                                </p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {totalCompletedToday}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Streak Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add New Streak
                    </button>
                </div>

                {/* Add Streak Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Add New Streak
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Streak Name *
                                </label>
                                <input
                                    type="text"
                                    value={newStreakName}
                                    onChange={(e) =>
                                        setNewStreakName(e.target.value)
                                    }
                                    placeholder="e.g., Daily Exercise, Read for 30 minutes"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newStreakDescription}
                                    onChange={(e) =>
                                        setNewStreakDescription(e.target.value)
                                    }
                                    placeholder="Add details about your streak goal..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={addStreak}
                                    disabled={!newStreakName.trim()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Streak
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewStreakName("");
                                        setNewStreakDescription("");
                                    }}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Streaks List */}
                <div className="space-y-4">
                    {streaks.length === 0 ? (
                        <div className="text-center py-12">
                            <Flame
                                className="mx-auto text-gray-400 mb-4"
                                size={48}
                            />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                No streaks yet
                            </h3>
                            <p className="text-gray-500">
                                Create your first streak to get started!
                            </p>
                        </div>
                    ) : (
                        streaks.map((streak) => {
                            const status = getStreakStatus(streak);
                            const completedToday = isCompletedToday(streak);

                            return (
                                <div
                                    key={streak._id}
                                    className="bg-white rounded-xl p-6 shadow-sm border"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-gray-800">
                                                    {streak.name}
                                                </h3>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                        status
                                                    )}`}
                                                >
                                                    {status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        status.slice(1)}
                                                </span>
                                            </div>
                                            {streak.description && (
                                                <p className="text-gray-600 mb-3">
                                                    {streak.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Flame
                                                        size={16}
                                                        className="text-orange-500"
                                                    />
                                                    Current:{" "}
                                                    {streak.currentStreak} days
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Target
                                                        size={16}
                                                        className="text-blue-500"
                                                    />
                                                    Best: {streak.longestStreak}{" "}
                                                    days
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar
                                                        size={16}
                                                        className="text-green-500"
                                                    />
                                                    Total:{" "}
                                                    {
                                                        streak.completedDates
                                                            .length
                                                    }{" "}
                                                    days
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() =>
                                                    markComplete(streak._id)
                                                }
                                                disabled={completedToday}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    completedToday
                                                        ? "bg-green-100 text-green-600 cursor-not-allowed"
                                                        : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                                                }`}
                                                title={
                                                    completedToday
                                                        ? "Already completed today"
                                                        : "Mark as complete"
                                                }
                                            >
                                                {completedToday ? (
                                                    <CheckCircle size={24} />
                                                ) : (
                                                    <Circle size={24} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    deleteStreak(streak._id)
                                                }
                                                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                title="Delete streak"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreakMaintainer;
