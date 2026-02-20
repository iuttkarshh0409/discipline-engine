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
console.log("Engine connecting to:", API_BASE);

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
    const [advice, setAdvice] = useState(null);
    const [fetchingAdvice, setFetchingAdvice] = useState(false);
    const [showForecastHistory, setShowForecastHistory] = useState(false);

    useEffect(() => {
        fetchAllProjects();
    }, []);

    const fetchAllProjects = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/projects`);
            setProjects(res.data);
            if (res.data.length > 0) {
                const latest = res.data.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                await fetchProjectDetail(latest.id);
            } else {
                setShowProjectForm(true);
            }
        } catch (err) {
            console.error("Fetch Projects Error:", err);
            setError("Connect to backend to see your projects.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectDetail = async (projectId) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/projects/${projectId}`);
            setProject(res.data);
            setSuggestedTaskData(null);
            setAdvice(null);
            setError(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const res = await axios.patch(`${API_BASE}/tasks/${taskId}/toggle`);
            const task = res.data;
            if (task.status) {
                setLastToggledTask(task);
                setTimeout(() => setLastToggledTask(prev => prev?.id === taskId ? null : prev), 8000);
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

    const getAdvice = async () => {
        setFetchingAdvice(true);
        try {
            const res = await axios.post(`${API_BASE}/projects/${project.id}/advisor?available_hours=${availableHours}`);
            setAdvice(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingAdvice(false);
        }
    };

    if (loading && !project) return <div className="container">Synchronizing Engine...</div>;

    if (error && !project) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h1>Phase 3 Engine Offline</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Failed to initialize context-aware modules. Please check backend.</p>
                <button onClick={fetchAllProjects} className="btn btn-primary" style={{ marginTop: '2rem' }}>Retry Sync</button>
            </div>
        );
    }

    if (showProjectForm) {
        return <ProjectForm onCreated={() => { setShowProjectForm(false); fetchAllProjects(); }} />;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                background: 'var(--panel-bg)',
                borderRight: '1px solid var(--card-border)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                        <Target size={12} /> Execution Units
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {projects.map(p => (
                            <div
                                key={p.id}
                                onClick={() => fetchProjectDetail(p.id)}
                                className={`sidebar-item ${project?.id === p.id ? 'active' : ''}`}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                            </div>
                        ))}
                        <button
                            onClick={() => setShowProjectForm(true)}
                            className="btn btn-secondary"
                            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', fontSize: '0.7rem' }}
                        >
                            <Plus size={14} /> Initialize Phase
                        </button>
                    </div>
                </div>

                {project && (
                    <div style={{ marginTop: 'auto' }}>
                        <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: '1rem' }}>
                            Engine Control
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div className="sidebar-item" onClick={() => setShowSettings(true)}>
                                <Settings size={14} /> Configuration
                            </div>
                            <div className="sidebar-item" onClick={() => fetchProjectDetail(project.id)}>
                                <BarChart3 size={14} /> Recalibrate Model
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="container" style={{ flex: 1, margin: 0, maxWidth: 'none', padding: '1.5rem 2.5rem' }}>
                {project && (
                    <>
                        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                                    <h1 style={{ fontSize: '1.5rem', letterSpacing: '0.05em' }}>{project.title}</h1>
                                    <div className={`badge badge-${project.pace_status.toLowerCase().replace(' ', '')}`}>
                                        {project.pace_status}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.85rem' }}>{project.description}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className={`risk-indicator risk-${project.risk_level.toLowerCase()}`}>
                                    <ShieldAlert size={16} />
                                    <div>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>Risk Vector</div>
                                        <div className="metric-value" style={{ fontSize: '1rem' }}>{project.risk_level} ({project.risk_score}%)</div>
                                    </div>
                                </div>
                                <div className="risk-indicator" style={{ color: 'var(--accent-primary)' }}>
                                    <Calendar size={16} />
                                    <div>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>Est. Completion</div>
                                        <div className="metric-value" style={{ fontSize: '1rem' }}>
                                            {project.forecast_completion ? format(new Date(project.forecast_completion), 'MMM dd, yyyy') : 'TBD'}
                                        </div>
                                    </div>
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
                                label="Delay Prob."
                                value={`${project.delay_prob}%`}
                                subtext={`Confidence: ${project.completion_percentage}%`} // Simplified confidence
                            />
                            <StatCard
                                icon={<Flag color="var(--success)" />}
                                label="Critical Path"
                                value={`${project.critical_path.length}`}
                                subtext="Unit blocks remaining"
                            />
                            <StatCard
                                icon={<AlertCircle color="var(--danger)" />}
                                label="Bottlenecks"
                                value={`${project.bottlenecks.length}`}
                                subtext="Execution friction points"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                            <section>
                                {/* Bottleneck Alerts */}
                                {project.bottlenecks.length > 0 && (
                                    <div className="glass" style={{ marginBottom: '1.5rem', borderLeft: '2px solid var(--danger)', background: '#1a1414' }}>
                                        <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                                            <AlertCircle size={14} /> Execution friction Detected
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {project.bottlenecks.map((b, i) => (
                                                <div key={i} style={{ padding: '0.5rem', background: '#0d0d0d', border: '1px solid #3d2a2a', fontSize: '0.75rem', fontFamily: 'var(--metric-font)' }}>
                                                    <span style={{ color: 'var(--danger)' }}>BLOCK [ID:{b.task_id}]</span> {b.reason} (IMPACT: {b.impact_severity}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Critical Path Visualization */}
                                <div className="glass" style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Tactical Execution Path</h2>
                                    <div className="gantt-view" style={{ display: 'flex', overflowX: 'auto', gap: '2px', paddingBottom: '0.5rem' }}>
                                        {project.tasks.filter(t => project.critical_path.includes(t.id)).map(task => (
                                            <div
                                                key={task.id}
                                                className="gantt-bar critical"
                                                style={{ width: `${Math.max(40, task.estimated_hours * 30)}px` }}
                                                title={`${task.title} (${task.estimated_hours}h)`}
                                            >
                                                {task.title.substring(0, 10)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Task Engine */}
                                <div className="glass">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                                        <h2 style={{ fontSize: '0.85rem' }}>Backlog Protocol</h2>
                                        <button className="btn btn-secondary" onClick={() => setShowTaskForm(true)} style={{ height: '28px', padding: '0 0.75rem' }}>
                                            <Plus size={14} /> Add Unit
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {project.tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`task-card ${task.status ? 'task-completed' : ''} ${project.critical_path.includes(task.id) ? 'task-critical' : ''}`}
                                                onClick={() => setViewingTask(task)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status ? 'var(--success)' : 'var(--card-border)' }}
                                                >
                                                    {task.status ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{task.title}</span>
                                                        {project.critical_path.includes(task.id) && !task.status && (
                                                            <span style={{ fontSize: '0.55rem', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '1px 4px', fontWeight: 700 }}>CRITICAL</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem', fontFamily: 'var(--metric-font)' }}>
                                                        <span>EST:{task.estimated_hours}H</span>
                                                        <span>IMP:{task.impact_score}/5</span>
                                                        {task.dependency_ids?.length > 0 && (
                                                            <span style={{ color: 'var(--warning)' }}>BLOCKS:{task.dependency_ids.length}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* AI Advisor Panel */}
                                <div className="glass ai-advisor">
                                    <h3 style={{ fontSize: '0.7rem', marginBottom: '1.25rem', color: 'var(--accent-primary)' }}>Execution Intelligence</h3>

                                    {!advice ? (
                                        <div style={{ padding: '0.25rem' }}>
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                                    Execution Window (Hrs)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={availableHours}
                                                    onChange={(e) => setAvailableHours(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={getAdvice}
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                disabled={fetchingAdvice}
                                            >
                                                {fetchingAdvice ? "Analyzing..." : "Analyze Priority"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div className="advice-block">
                                                <div className="advice-label">Strategic Priority</div>
                                                <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{advice.strategic_explanation}</p>
                                            </div>
                                            <div className="advice-block">
                                                <div className="advice-label">Risk Mitigation</div>
                                                <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{advice.risk_aware_reasoning}</p>
                                            </div>
                                            <button onClick={() => setAdvice(null)} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>Reset</button>
                                        </div>
                                    )}
                                </div>

                                {/* Roadmap Context */}
                                <div className="glass" style={{ background: '#090b0d' }}>
                                    <h3 style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Project Intelligence</h3>
                                    <p style={{ fontSize: '0.75rem', lineHeight: 1.5, whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{project.roadmap_text}</p>
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
        <div className="glass" style={{ borderLeft: '2px solid var(--accent-primary)', background: 'var(--panel-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                <div style={{ opacity: 0.5 }}>{icon}</div>
            </div>
            <div className="metric-value" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontFamily: 'var(--metric-font)', borderTop: '1px solid var(--card-border)', paddingTop: '0.4rem' }}>
                {subtext}
            </div>
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
            alert("Bootstrap failed. Ensure Phase 3 Backend is active.");
        }
    };

    return (
        <div className="container" style={{ maxWidth: '480px', marginTop: '6rem' }}>
            <div className="glass" style={{ borderTop: '2px solid var(--accent-primary)', padding: '2rem' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>INITIALIZE EXECUTION PHASE</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.75rem' }}>Define core objective and temporal constraints.</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Project Objective</label>
                        <input
                            required
                            className="input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. AlumConnect Phase 3"
                            style={{ fontSize: '0.85rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Operational Vision</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe success parameters..."
                            style={{ fontSize: '0.85rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Temporal Deadline</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.deadline}
                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            style={{ fontSize: '0.85rem' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', height: '3rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                        DEPRECATE ANALOG / DEPLOY ENGINE
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,9,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: '480px', borderTop: '2px solid var(--accent-primary)', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>INJECT EXECUTION UNIT</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        required
                        className="input"
                        placeholder="Unit identifier (e.g. Design DFD)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                    />

                    <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Milestone Affiliation</label>
                        <select
                            className="input"
                            value={formData.milestone_id}
                            onChange={e => setFormData({ ...formData, milestone_id: e.target.value })}
                            style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}
                        >
                            <option value="">GENERAL BACKLOG</option>
                            {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Est. Hours</label>
                            <input type="number" step="0.5" className="input" value={formData.estimated_hours} onChange={e => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })} style={{ marginTop: '0.25rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Date</label>
                            <input type="date" className="input" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} style={{ marginTop: '0.25rem' }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Impact Vector (1-5)</label>
                            <input type="range" min="1" max="5" style={{ accentColor: 'var(--accent-primary)', width: '100%', marginTop: '0.5rem' }} value={formData.impact_score} onChange={e => setFormData({ ...formData, impact_score: parseInt(e.target.value) })} />
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontFamily: 'var(--metric-font)' }}>{formData.impact_score}/05</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complexity (1-5)</label>
                            <input type="range" min="1" max="5" style={{ accentColor: 'var(--accent-secondary)', width: '100%', marginTop: '0.5rem' }} value={formData.effort_score} onChange={e => setFormData({ ...formData, effort_score: parseInt(e.target.value) })} />
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontFamily: 'var(--metric-font)' }}>{formData.effort_score}/05</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Abort</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Commit Unit</button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,9,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: '420px', borderTop: '2px solid var(--accent-secondary)', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>STRATEGIC MILESTONE DEFINITION</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input
                        required
                        className="input"
                        placeholder="Identifier (e.g. CORE.SCHEMA_FREEZE)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                    />
                    <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Objective Parameters</label>
                        <textarea
                            className="input"
                            rows="2"
                            placeholder="Primary achievement criteria..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weighted Importance</label>
                        <select className="input" value={formData.weight} onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) })} style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <option value="1">LVL 1 - MINOR</option>
                            <option value="2">LVL 2 - SUPPORT</option>
                            <option value="3">LVL 3 - CORE</option>
                            <option value="4">LVL 4 - CRUCIAL</option>
                            <option value="5">LVL 5 - BREAKTHROUGH</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Constraint Date</label>
                        <input type="date" className="input" value={formData.target_date} onChange={e => setFormData({ ...formData, target_date: e.target.value })} style={{ fontSize: '0.85rem', marginTop: '0.25rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Abort</button>
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
    const [structuring, setStructuring] = useState(false);
    const [prePlan, setPrePlan] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects/${project.id}/context`, formData);
            onUpdated();
        } catch (err) {
            console.error(err);
        }
    };

    const runAutoStructure = async () => {
        setStructuring(true);
        try {
            const res = await axios.post(`${API_BASE}/projects/${project.id}/auto-structure-plan`, { text: formData.roadmap_text });
            setPrePlan(res.data);
        } catch (err) {
            console.error(err);
            alert("AI Ingestion failed.");
        } finally {
            setStructuring(false);
        }
    };

    const commitAutoPlan = async () => {
        if (!prePlan) return;
        try {
            for (const t of prePlan.tasks) {
                await axios.post(`${API_BASE}/projects/${project.id}/tasks`, t);
            }
            for (const m of prePlan.milestones) {
                await axios.post(`${API_BASE}/projects/${project.id}/milestones`, { ...m, project_id: project.id });
            }
            alert("Plan successfully structured into Roadmap.");
            setPrePlan(null);
            onUpdated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,9,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass" style={{ width: prePlan ? '900px' : '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Configuration & AI Ingestion</h3>

                {!prePlan ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Strategic Roadmap (AI Input)</label>
                            <textarea
                                className="input"
                                rows="8"
                                value={formData.roadmap_text}
                                onChange={e => setFormData({ ...formData, roadmap_text: e.target.value })}
                                placeholder="Paste high-level steps or raw notes..."
                                style={{ fontSize: '0.75rem' }}
                            />
                            <button
                                type="button"
                                onClick={runAutoStructure}
                                className="btn btn-secondary"
                                style={{ marginTop: '0.5rem', width: '100%', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                                disabled={structuring || !formData.roadmap_text}
                            >
                                <Zap size={14} /> {structuring ? "Analyzing..." : "Trigger AI Structuring"}
                            </button>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Technical Architecture</label>
                            <textarea
                                className="input"
                                rows="4"
                                value={formData.architecture_notes}
                                onChange={e => setFormData({ ...formData, architecture_notes: e.target.value })}
                                placeholder="Describe technical stack and data structures..."
                                style={{ fontSize: '0.75rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Configuration</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div style={{ background: '#090b0d', padding: '1rem', border: '1px solid var(--accent-primary)', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>AI Structuring Proposal</h4>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Review proposed units before database commitment.</p>
                        </div>

                        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                            <div>
                                <h5 style={{ marginBottom: '0.75rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Proposed Task Units ({prePlan.tasks.length})</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {prePlan.tasks.map((t, i) => (
                                        <div key={i} style={{ padding: '0.5rem', background: '#090b0d', border: '1px solid var(--card-border)', fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                                            {t.title} <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--metric-font)' }}>[{t.estimated_hours}H]</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h5 style={{ marginBottom: '0.75rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Proposed Milestones ({prePlan.milestones.length})</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {prePlan.milestones.map((m, i) => (
                                        <div key={i} style={{ padding: '0.5rem', background: '#090b0d', border: '1px solid var(--accent-secondary)', fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                                            {m.title} <span style={{ fontSize: '0.6rem', color: 'var(--accent-secondary)', marginLeft: '0.5rem' }}>WEIGHT:{m.weight}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setPrePlan(null)} className="btn btn-secondary" style={{ flex: 1 }}>Discard Proposal</button>
                            <button onClick={commitAutoPlan} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Deploy Structuring</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function GuidanceModal({ task, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,9,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
            <div className="glass" style={{ width: '640px', borderTop: '2px solid var(--accent-secondary)', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Execution Protocol</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{task.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.85rem' }}>
                    {task.description}
                </p>

                <div style={{ background: '#090b0d', padding: '1.5rem', border: '1px solid var(--card-border)' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.65rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Operational Guidelines
                    </h4>
                    {task.guidance ? (
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {task.guidance}
                        </div>
                    ) : (
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            No procedural guidance available for this unit.
                        </p>
                    )}
                </div>

                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '2.5rem', height: '3rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                    Acknowledge & Commence
                </button>
            </div>
        </div>
    );
}

export default App;
