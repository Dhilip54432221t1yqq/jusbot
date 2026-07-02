import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Clock, Save, Info, Calendar, 
    AlertCircle, CheckCircle2, Loader2, ChevronDown 
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import config from '../../config';

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

const DEFAULT_HOURS = {
    monday: { type: 'open_all_day', hours: [] },
    tuesday: { type: 'open_all_day', hours: [] },
    wednesday: { type: 'open_all_day', hours: [] },
    thursday: { type: 'open_all_day', hours: [] },
    friday: { type: 'open_all_day', hours: [] },
    saturday: { type: 'open_all_day', hours: [] },
    sunday: { type: 'open_all_day', hours: [] }
};

export default function BusinessHours() {
    const { workspaceId } = useParams();
    const { activeWorkspace, fetchWorkspace } = useWorkspace();
    const { authFetch } = useAuth();
    
    const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (activeWorkspace) {
            if (activeWorkspace.business_hours) {
                // Merge loaded config with default keys to handle missing days gracefully
                setBusinessHours({
                    ...DEFAULT_HOURS,
                    ...activeWorkspace.business_hours
                });
            } else {
                setBusinessHours(DEFAULT_HOURS);
            }
        }
    }, [activeWorkspace]);

    const handleTypeChange = (dayKey, type) => {
        setBusinessHours(prev => {
            const dayData = prev[dayKey] || { type: 'open_all_day', hours: [] };
            let newHours = [...(dayData.hours || [])];
            
            if (type === 'open_hours' && newHours.length === 0) {
                newHours = [{ start: '09:00', end: '17:00' }];
            } else if (type === 'two_open_hours') {
                if (newHours.length === 0) {
                    newHours = [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '18:00' }
                    ];
                } else if (newHours.length === 1) {
                    newHours = [
                        newHours[0],
                        { start: '14:00', end: '18:00' }
                    ];
                }
            }
            
            return {
                ...prev,
                [dayKey]: {
                    ...dayData,
                    type,
                    hours: newHours
                }
            };
        });
    };

    const handleTimeChange = (dayKey, index, field, value) => {
        // Simple basic validation for HH:MM format (allows typing, but cleans it up)
        setBusinessHours(prev => {
            const dayData = prev[dayKey] || { type: 'open_all_day', hours: [] };
            const newHours = [...(dayData.hours || [])];
            if (!newHours[index]) {
                newHours[index] = { start: '09:00', end: '17:00' };
            }
            newHours[index] = {
                ...newHours[index],
                [field]: value
            };
            return {
                ...prev,
                [dayKey]: {
                    ...dayData,
                    hours: newHours
                }
            };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        try {
            // Validate all open hours before sending to server
            for (const day of DAYS_OF_WEEK) {
                const dayData = businessHours[day.key];
                if (dayData.type === 'open_hours' || dayData.type === 'two_open_hours') {
                    const count = dayData.type === 'open_hours' ? 1 : 2;
                    for (let i = 0; i < count; i++) {
                        const slot = dayData.hours[i];
                        if (!slot || !slot.start || !slot.end) {
                            throw new Error(`Please specify start and end times for ${day.label}.`);
                        }
                        
                        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
                            throw new Error(`Invalid time format for ${day.label}. Please use HH:MM (e.g. 09:30).`);
                        }
                    }
                }
            }

            const response = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: activeWorkspace?.name,
                    logo_url: activeWorkspace?.logo_url,
                    timezone: activeWorkspace?.timezone,
                    default_theme: activeWorkspace?.default_theme,
                    business_hours: businessHours
                })
            });

            if (!response.ok) throw new Error('Failed to update workspace business hours');

            await fetchWorkspace(workspaceId);
            setSaved(true);
            toast.success('Business hours updated successfully!');
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving business hours:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
                        Business Hours
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        The time intervals that allow the bot to check if it is in business hours. It is based on your workspace timezone setting.
                    </p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl border border-green-100 hidden sm:block">
                    <Calendar size={24} />
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-400">
                        <Clock size={16} className="text-slate-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Weekly Schedule</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {DAYS_OF_WEEK.map((day) => {
                            const dayData = businessHours[day.key] || { type: 'open_all_day', hours: [] };
                            return (
                                <div key={day.key} className="py-6 first:pt-0 last:pb-0">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                        <div className="w-28 flex-shrink-0">
                                            <span className="text-sm font-semibold text-slate-800 capitalize">
                                                {day.label}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <select
                                                    value={dayData.type}
                                                    onChange={(e) => handleTypeChange(day.key, e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none min-w-[180px] shadow-sm cursor-pointer"
                                                >
                                                    <option value="open_all_day">Open all day</option>
                                                    <option value="closed">Closed</option>
                                                    <option value="open_hours">Open hours</option>
                                                    <option value="two_open_hours">Two open hours</option>
                                                </select>

                                                {(dayData.type === 'open_hours' || dayData.type === 'two_open_hours') && (
                                                    <div className="flex gap-2 items-center flex-1 min-w-[280px] max-w-md">
                                                        <TimeInput
                                                            value={dayData.hours[0]?.start || ''}
                                                            onChange={(val) => handleTimeChange(day.key, 0, 'start', val)}
                                                            placeholder="Start time"
                                                        />
                                                        <span className="text-xs font-bold text-slate-400 px-1">to</span>
                                                        <TimeInput
                                                            value={dayData.hours[0]?.end || ''}
                                                            onChange={(val) => handleTimeChange(day.key, 0, 'end', val)}
                                                            placeholder="End time"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {dayData.type === 'two_open_hours' && (
                                                <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {/* Spacer matching select width */}
                                                    <div className="w-[180px] hidden md:block" />
                                                    
                                                    <div className="flex gap-2 items-center flex-1 min-w-[280px] max-w-md">
                                                        <TimeInput
                                                            value={dayData.hours[1]?.start || ''}
                                                            onChange={(val) => handleTimeChange(day.key, 1, 'start', val)}
                                                            placeholder="Start time"
                                                        />
                                                        <span className="text-xs font-bold text-slate-400 px-1">to</span>
                                                        <TimeInput
                                                            value={dayData.hours[1]?.end || ''}
                                                            onChange={(val) => handleTimeChange(day.key, 1, 'end', val)}
                                                            placeholder="End time"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-inner">
                    <Info className="text-slate-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Hours are checked in real-time according to your workspace's timezone settings. If timezone is not configured, it will default to UTC.
                    </p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        {saved && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-4">
                                <CheckCircle2 size={16} />
                                Settings saved successfully!
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}

function TimeInput({ value, onChange, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            timeOptions.push(`${h}:${m}`);
        }
    }

    const isExactMatch = timeOptions.includes(value);
    const filteredOptions = isExactMatch || !value
        ? timeOptions 
        : timeOptions.filter(time => time.includes(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isOpen && value && listRef.current) {
            const index = filteredOptions.indexOf(value);
            if (index !== -1) {
                listRef.current.scrollTop = index * 32 - 40;
            }
        }
    }, [isOpen, value, filteredOptions]);

    const handleChange = (e) => {
        const val = e.target.value;
        const cleanVal = val.replace(/[^0-9:]/g, '');
        if (cleanVal.length <= 5) {
            onChange(cleanVal);
            setIsOpen(true);
        }
    };

    return (
        <div ref={containerRef} className="relative flex-1 max-w-[160px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                <Clock size={14} />
            </div>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none shadow-sm cursor-pointer"
            />
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-full px-3 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
            >
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div 
                    ref={listRef} 
                    className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 custom-scrollbar"
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((time) => {
                            const isSelected = time === value;
                            return (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => {
                                        onChange(time);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                                        isSelected 
                                            ? 'bg-green-500 text-white' 
                                            : 'text-slate-700 hover:bg-green-50 hover:text-green-600'
                                    }`}
                                >
                                    {time}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-4 py-2 text-[10px] text-slate-400 font-bold">No results</div>
                    )}
                </div>
            )}
        </div>
    );
}
