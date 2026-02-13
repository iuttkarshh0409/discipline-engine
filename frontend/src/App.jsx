import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircle2,
    Circle,
    Plus,
    Target,
    TrendingUp,
    Clock,
    Calendar,
    Zap,
    ChevronRight,
    AlertCircle,
    ShieldAlert,
    BarChart3,
    Flag,
    Settings,
    ListTodo
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function App() {
    const [project, setProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableHours, setAvailableHours] = useState(2);
    const [suggestedTaskData, setSuggestedTaskData] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [lastToggledTask, setLastToggledTask] = useState(null);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAllProjects();
    }, []);

    const fetchAllProjects = async () => {
        try {
            const res = await axios.get(`${API_BASE}/projects`);
            setProjects(res.data);
            if (res.data.length > 0 && !project) {
                const latest = res.data.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                fetchProjectDetail(latest.id);
            } else if (res.data.length === 0) {
                setShowProjectForm(true);
            }
        } catch (err) {
            console.error(err);
            setError("Connect to backend to see your projects.");
        }
    };

    const fetchProjectDetail = async (projectId) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/projects/${projectId}`);
            setProject(res.data);
            setSuggestedTaskData(null);
            fetchAnalytics(projectId);
            setError(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async (projectId) => {
        try {
            const res = await axios.get(`${API_BASE}/projects/${projectId}/analytics`);
            setAnalytics(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const handleToggleTask = async (taskId) => {
        try {
            const res = await axios.patch(`${API_BASE}/tasks/${taskId}/toggle`);
            const task = res.data;
            if (task.status) {
                setLastToggledTask(task);
                setTimeout(() => setLastToggledTask(prev => prev?.id === taskId ? null : prev), 8000);
            } else {
                setLastToggledTask(null);
            }
            fetchProjectDetail(project.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleMilestone = async (milestoneId) => {
        try {
            await axios.patch(`${API_BASE}/milestones/${milestoneId}/toggle`);
            fetchProjectDetail(project.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUndo = async () => {
        if (!lastToggledTask) return;
        const taskId = lastToggledTask.id;
        try {
            await axios.patch(`${API_BASE}/tasks/${taskId}/toggle`);
            setLastToggledTask(null);
            fetchProjectDetail(project.id);
        } catch (err) {
            console.error(err);
        }
    };

    const getSuggestion = async () => {
        if (!project) return;
        try {
            const res = await axios.get(`${API_BASE}/projects/${project.id}/suggest-next?available_hours=${availableHours}`);
            setSuggestedTaskData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !project) return <div className="container">Synchronizing Engine...</div>;

    if (showProjectForm) {
        return <ProjectForm onCreated={() => { setShowProjectForm(false); fetchAllProjects(); }} />;
    }

    if (error && !project) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h1>Phase 2 Engine Offline</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Failed to initialize context-aware modules. Please check backend.</p>
                <button onClick={fetchAllProjects} className="btn btn-primary" style={{ marginTop: '2rem' }}>Retry Sync</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
            {/* Sidebar v2 */}
            <aside style={{
                width: '280px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderRight: '1px solid var(--card-border)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={14} /> Projects
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {projects.map(p => (
                            <div
                                key={p.id}
                                onClick={() => fetchProjectDetail(p.id)}
                                className={`sidebar-item ${project?.id === p.id ? 'active' : ''}`}
                            >
                                <ChevronRight size={14} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                            </div>
                        ))}
                        <button
                            onClick={() => setShowProjectForm(true)}
                            className="btn btn-secondary"
                            style={{ borderStyle: 'dashed', marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        >
                            <Plus size={18} /> New Project
                        </button>
                    </div>
                </div>

                {project && (
                    <div>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: '1.25rem' }}>
                            Control
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="sidebar-item" onClick={() => setShowSettings(true)}>
                                <Settings size={18} /> Engine Settings
                            </div>
                            <div className="sidebar-item" onClick={() => fetchAnalytics(project.id)}>
                                <BarChart3 size={18} /> Refresh Intel
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content v2 */}
            <main className="container" style={{ flex: 1, margin: 0, maxWidth: 'none', padding: '2.5rem 3rem' }}>
                {project && (
                    <>
                        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <h1 style={{ fontSize: '2.5rem' }}>{project.title}</h1>
                                    <div className={`badge badge-${project.pace_status.toLowerCase().replace(' ', '')}`}>
                                        {project.pace_status}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', fontSize: '1.1rem' }}>{project.description}</p>
                            </div>

                            <div className={`risk-indicator risk-${project.risk_level.toLowerCase()}`}>
                                <ShieldAlert size={20} />
                                <div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Risk Level</div>
                                    <div style={{ fontSize: '1.1rem' }}>{project.risk_level} ({project.risk_score}%)</div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
                            <StatCard
                                icon={<Target color="var(--accent-primary)" />}
                                label="Completion"
                                value={`${project.completion_percentage}%`}
                                subtext={`${project.completed_tasks} / ${project.total_tasks} Tasks`}
                            />
                            <StatCard
                                icon={<Clock color="var(--accent-secondary)" />}
                                label="Time Left"
                                value={`${project.days_left}d`}
                                subtext={`Target: ${format(new Date(project.deadline), 'MMM dd')}`}
                            />
                            <StatCard
                                icon={<BarChart3 color="var(--success)" />}
                                label="Velocity"
                                value={`${analytics?.current_velocity || project.avg_tasks_per_day}`}
                                subtext="Tasks per day"
                            />
                            <StatCard
                                icon={<TrendingUp color="var(--warning)" />}
                                label="Consistency"
                                value={`${analytics?.consistency_score || 0}%`}
                                subtext="Flow stability"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
                            <section>
                                {/* Milestones Phase 2 */}
                                <div className="glass" style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Flag size={20} color="var(--accent-secondary)" /> Milestones
                                        </h2>
                                        <button className="btn btn-secondary" onClick={() => setShowMilestoneForm(true)}>
                                            <Plus size={16} /> Add Milestone
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {project.milestones.length === 0 && (
                                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No milestones defined for this roadmap.</p>
                                        )}
                                        {project.milestones.map(m => (
                                            <div key={m.id} className="milestone-card" style={{ opacity: m.status ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <button
                                                    onClick={() => handleToggleMilestone(m.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.status ? 'var(--success)' : 'var(--text-secondary)' }}
                                                >
                                                    {m.status ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: 600, textDecoration: m.status ? 'line-through' : 'none' }}>{m.title}</span>
                                                        <span className="milestone-weight">W:{m.weight}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Target: {m.target_date ? format(new Date(m.target_date), 'MMM dd') : 'TBD'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Task Engine */}
                                <div className="glass">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <ListTodo size={20} color="var(--accent-primary)" /> Task Backlog
                                        </h2>
                                        <button className="btn btn-secondary" onClick={() => setShowTaskForm(true)}>
                                            <Plus size={16} /> New Task
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {project.tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`task-card ${task.status ? 'task-completed' : ''}`}
                                                style={{ cursor: 'pointer', padding: '1.25rem' }}
                                                onClick={(e) => {
                                                    if (e.target.closest('.toggle-btn')) return;
                                                    setViewingTask(task);
                                                }}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleTask(task.id);
                                                    }}
                                                    className="toggle-btn"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status ? 'var(--success)' : 'var(--text-secondary)' }}
                                                >
                                                    {task.status ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{task.title}</h4>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <span style={{ color: task.impact_score >= 4 ? 'var(--warning)' : 'inherit' }}>Impact: {task.impact_score}/5</span>
                                                        <span>Effort: {task.effort_score}/5</span>
                                                        <span>{task.estimated_hours}h</span>
                                                        {task.milestone_id && (
                                                            <span style={{ color: 'var(--accent-secondary)' }}>
                                                                <Flag size={10} style={{ marginRight: '2px' }} />
                                                                {project.milestones.find(m => m.id === task.milestone_id)?.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Intelligence Suggestion Phase 2 */}
                                <div className="glass" style={{ border: '1px solid var(--accent-primary)', position: 'sticky', top: '2.5rem' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <Zap size={20} color="var(--warning)" fill="var(--warning)" /> context-Aware Suggestion
                                    </h3>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                            Available Execution Window (Hours)
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                className="input"
                                                value={availableHours}
                                                onChange={(e) => setAvailableHours(e.target.value)}
                                            />
                                            <button onClick={getSuggestion} className="btn btn-primary" style={{ padding: '0.75rem' }}>Analyze</button>
                                        </div>
                                    </div>

                                    {suggestedTaskData ? (
                                        <div style={{ padding: '1.25rem', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>High Probability Success</div>
                                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{suggestedTaskData.task.title}</h4>

                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Engine Reasoning:</div>
                                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {suggestedTaskData.reasoning.impact > 0 && <li>✅ High strategic impact (+{suggestedTaskData.reasoning.impact})</li>}
                                                    {suggestedTaskData.reasoning.milestone > 0 && <li>🎯 Contributes to active milestone (+{suggestedTaskData.reasoning.milestone})</li>}
                                                    {suggestedTaskData.reasoning.urgency > 0 && <li>⏳ Proximity to internal deadline (+{suggestedTaskData.reasoning.urgency})</li>}
                                                    {suggestedTaskData.reasoning.time_fit > 0 && <li>⚡ Perfect fit for current window (+{suggestedTaskData.reasoning.time_fit})</li>}
                                                    {suggestedTaskData.reasoning.delay_penalty < 0 && <li>⚠️ Mitigates project slippage risk ({suggestedTaskData.reasoning.delay_penalty})</li>}
                                                </ul>
                                            </div>

                                            <button
                                                onClick={() => handleToggleTask(suggestedTaskData.task.id).then(() => setSuggestedTaskData(null))}
                                                className="btn btn-primary"
                                                style={{ width: '100%', marginTop: '0.5rem' }}
                                            >
                                                Begin Execution
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                                            The suggestion engine requires an availability window to calculate optimal ROI on your time.
                                        </p>
                                    )}
                                </div>

                                <div className="glass" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Project Roadmap Summary</h3>
                                    {project.roadmap_text ? (
                                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{project.roadmap_text}</p>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>No context notes stored. Use settings to add Roadmap and Architecture data.</p>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </>
                )}

                {/* Modals Phase 2 */}
                {showTaskForm && (
                    <TaskModal
                        projectId={project.id}
                        milestones={project.milestones}
                        onClose={() => setShowTaskForm(false)}
                        onCreated={() => { setShowTaskForm(false); fetchProjectDetail(project.id); }}
                    />
                )}

                {showMilestoneForm && (
                    <MilestoneModal
                        projectId={project.id}
                        onClose={() => setShowMilestoneForm(false)}
                        onCreated={() => { setShowMilestoneForm(false); fetchProjectDetail(project.id); }}
                    />
                )}

                {showSettings && (
                    <SettingsModal
                        project={project}
                        onClose={() => setShowSettings(false)}
                        onUpdated={() => { setShowSettings(false); fetchProjectDetail(project.id); }}
                    />
                )}

                {viewingTask && (
                    <GuidanceModal
                        task={viewingTask}
                        onClose={() => setViewingTask(null)}
                    />
                )}

                {lastToggledTask && (
                    <div className="glass" style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <CheckCircle2 size={24} />
                        <div>
                            <div style={{ fontWeight: 700 }}>Task Locked!</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Intelligence and velocity updated.</div>
                        </div>
                        <button
                            onClick={handleUndo}
                            className="btn"
                            style={{ background: 'white', color: 'var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            Undo
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, subtext }) {
    return (
        <div className="glass" style={{ padding: '1.5rem', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>{icon}</div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtext}</div>
        </div>
    );
}

function ProjectForm({ onCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: format(new Date().setDate(new Date().getDate() + 30), 'yyyy-MM-dd')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects`, {
                ...formData,
                start_date: new Date().toISOString(),
                deadline: new Date(formData.deadline).toISOString()
            });
            onCreated();
        } catch (err) {
            console.error(err);
            alert("Bootstrap failed. Ensure Phase 2 Backend is active.");
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', marginTop: '6rem' }}>
            <div className="glass" style={{ border: '1px solid var(--accent-primary)' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Initialize New Phase</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Define the core objective and deadline for context tracking.</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Project Objective</label>
                        <input
                            required
                            className="input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. AlumConnect Phase 2"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Vision / Description</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What does success look like?"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Hard Deadline</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.deadline}
                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', height: '3.5rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                        Deploy Discipline Engine
                    </button>
                </form>
            </div>
        </div>
    );
}

function TaskModal({ projectId, milestones, onClose, onCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        estimated_hours: 2,
        impact_score: 3,
        effort_score: 3,
        deadline: '',
        milestone_id: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects/${projectId}/tasks`, {
                ...formData,
                milestone_id: formData.milestone_id ? parseInt(formData.milestone_id) : null,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            });
            onCreated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: '550px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Inject New Task</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input
                        required
                        className="input"
                        placeholder="Task title (e.g. Design DFD Level 1)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />

                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Associated Milestone</label>
                        <select
                            className="input"
                            style={{ padding: '0.75rem' }}
                            value={formData.milestone_id}
                            onChange={e => setFormData({ ...formData, milestone_id: e.target.value })}
                        >
                            <option value="">No Milestone (General Task)</option>
                            {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Est. Hours</label>
                            <input type="number" step="0.5" className="input" value={formData.estimated_hours} onChange={e => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Target Date</label>
                            <input type="date" className="input" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Strategic Impact (1-5)</label>
                            <input type="range" min="1" max="5" style={{ accentColor: 'var(--accent-primary)' }} value={formData.impact_score} onChange={e => setFormData({ ...formData, impact_score: parseInt(e.target.value) })} />
                            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>{formData.impact_score} / 5</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Complexity/Effort (1-5)</label>
                            <input type="range" min="1" max="5" style={{ accentColor: 'var(--accent-secondary)' }} value={formData.effort_score} onChange={e => setFormData({ ...formData, effort_score: parseInt(e.target.value) })} />
                            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>{formData.effort_score} / 5</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Abort</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Commit Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function MilestoneModal({ projectId, onClose, onCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        weight: 3,
        target_date: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects/${projectId}/milestones`, {
                ...formData,
                target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null
            });
            onCreated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: '450px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Strategic Milestone</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input
                        required
                        className="input"
                        placeholder="Milestone Title (e.g. Schema Freeze)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Strategic Weight (Priority)</label>
                        <select className="input" value={formData.weight} onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) })}>
                            <option value="1">1 - Minor Milestone</option>
                            <option value="2">2 - Supporting Milestone</option>
                            <option value="3">3 - Core Milestone</option>
                            <option value="4">4 - Crucial Milestone</option>
                            <option value="5">5 - Critical Breakthrough</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Target Completion</label>
                        <input type="date" className="input" value={formData.target_date} onChange={e => setFormData({ ...formData, target_date: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Set Milestone</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SettingsModal({ project, onClose, onUpdated }) {
    const [formData, setFormData] = useState({
        roadmap_text: project.roadmap_text || '',
        architecture_notes: project.architecture_notes || '',
        context_notes: project.context_notes || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects/${project.id}/context`, formData);
            onUpdated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: '700px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Context Ingestion</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project Roadmap / High-Level Steps</label>
                        <textarea
                            className="input"
                            rows="5"
                            value={formData.roadmap_text}
                            onChange={e => setFormData({ ...formData, roadmap_text: e.target.value })}
                            placeholder="Paste your 10-step roadmap here..."
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Architecture & Technical Stack</label>
                        <textarea
                            className="input"
                            rows="5"
                            value={formData.architecture_notes}
                            onChange={e => setFormData({ ...formData, architecture_notes: e.target.value })}
                            placeholder="Describe database structure, frontend/backend architecture..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Apply Context</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function GuidanceModal({ task, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
            <div className="glass" style={{ width: '600px', border: '1px solid var(--accent-secondary)', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Execution Guidance</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                </div>

                <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>{task.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    {task.description}
                </p>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Protocol Steps
                    </h4>
                    {task.guidance ? (
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            {task.guidance}
                        </div>
                    ) : (
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            No tactical guidance provided for this unit.
                        </p>
                    )}
                </div>

                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '3rem', height: '3.5rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                    Confirm & Start Work
                </button>
            </div>
        </div>
    );
}

export default App;
