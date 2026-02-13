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
    AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const API_BASE = 'http://localhost:8000';

function App() {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableHours, setAvailableHours] = useState(2);
    const [suggestedTask, setSuggestedTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [lastToggledTask, setLastToggledTask] = useState(null);

    useEffect(() => {
        fetchProject();
    }, []);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/projects`);
            if (res.data.length > 0) {
                // Get the most recent project (with the highest ID)
                const latest = res.data.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                const projectRes = await axios.get(`${API_BASE}/projects/${latest.id}`);
                setProject(projectRes.data);
                setError(null);
            } else {
                setShowProjectForm(true);
            }
        } catch (err) {
            console.error(err);
            setError("Connect to backend to see your projects.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const res = await axios.patch(`${API_BASE}/tasks/${taskId}/toggle`);
            const task = res.data;

            // Only set undo if we marked it as complete
            if (task.status) {
                setLastToggledTask(task);
                setTimeout(() => setLastToggledTask(prev => prev?.id === taskId ? null : prev), 8000);
            } else {
                setLastToggledTask(null);
            }

            fetchProject();
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
            fetchProject();
        } catch (err) {
            console.error(err);
        }
    };

    const getSuggestion = async () => {
        if (!project) return;
        try {
            const res = await axios.get(`${API_BASE}/projects/${project.id}/suggest-next?available_hours=${availableHours}`);
            setSuggestedTask(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container">Loading engine...</div>;

    if (showProjectForm) {
        return <ProjectForm onCreated={() => { setShowProjectForm(false); fetchProject(); }} />;
    }

    if (error && !project) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h1>Backend Not Connected</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Please start the FastAPI server at {API_BASE}</p>
                <button onClick={fetchProject} className="btn btn-primary" style={{ marginTop: '2rem' }}>Retry Connection</button>
            </div>
        );
    }

    return (
        <div className="container">
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{project.title}</h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>{project.description}</p>
                </div>
                <div className={`badge badge-${project.pace_status.toLowerCase().replace(' ', '')}`}>
                    {project.pace_status}
                </div>
            </header>

            <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
                <StatCard
                    icon={<Target color="var(--accent-primary)" />}
                    label="Progress"
                    value={`${project.completion_percentage}%`}
                    subtext={`${project.completed_tasks} / ${project.total_tasks} Tasks`}
                />
                <StatCard
                    icon={<Clock color="var(--accent-secondary)" />}
                    label="Days Remaining"
                    value={project.days_left}
                    subtext={`Deadline: ${format(new Date(project.deadline), 'MMM dd, yyyy')}`}
                />
                <StatCard
                    icon={<TrendingUp color="var(--success)" />}
                    label="Pace"
                    value={`${project.avg_tasks_per_day}`}
                    subtext="Avg tasks / day"
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.completion_percentage}%` }}></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <section className="glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Tasks</h2>
                        <button className="btn btn-secondary" onClick={() => setShowTaskForm(true)}>
                            <Plus size={18} /> Add Task
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {project.tasks.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No tasks yet. Start by adding one!</p>
                        )}
                        {project.tasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-card ${task.status ? 'task-completed' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    // Don't trigger if clicking the toggle button
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
                                    <h4 style={{ fontSize: '1.1rem' }}>{task.title}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        <span>Impact: {task.impact_score}/5</span>
                                        <span>Effort: {task.effort_score}/5</span>
                                        <span>{task.estimated_hours}h</span>
                                        {task.deadline && (
                                            <span>Due: {format(new Date(task.deadline), 'MMM dd')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <aside>
                    <div className="glass" style={{ marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Zap size={20} color="var(--warning)" fill="var(--warning)" />
                            Next Best Action
                        </h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                How much time do you have? (hours)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    className="input"
                                    value={availableHours}
                                    onChange={(e) => setAvailableHours(e.target.value)}
                                />
                                <button onClick={getSuggestion} className="btn btn-primary">Score</button>
                            </div>
                        </div>

                        {suggestedTask ? (
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{suggestedTask.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{suggestedTask.description}</p>
                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8rem' }}>Est: {suggestedTask.estimated_hours}h</span>
                                    <button
                                        onClick={() => handleToggleTask(suggestedTask.id).then(() => setSuggestedTask(null))}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Enter availability and click Score to see what to do next.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            {showTaskForm && (
                <TaskModal
                    projectId={project.id}
                    onClose={() => setShowTaskForm(false)}
                    onCreated={() => { setShowTaskForm(false); fetchProject(); }}
                />
            )}

            {viewingTask && (
                <GuidanceModal
                    task={viewingTask}
                    onClose={() => setViewingTask(null)}
                />
            )}

            {lastToggledTask && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <span>Task marked as complete!</span>
                    <button
                        onClick={handleUndo}
                        className="btn"
                        style={{ background: 'white', color: 'var(--accent-primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                        Undo
                    </button>
                    <button
                        onClick={() => setLastToggledTask(null)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, subtext }) {
    return (
        <div className="glass" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {icon}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtext}</div>
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
            alert("Failed to create project. Is the backend running?");
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
            <div className="glass">
                <h2 style={{ marginBottom: '1.5rem' }}>Initialize Project Discipline</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Project Title</label>
                        <input
                            required
                            className="input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Build MVP, Write Book..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Deadline</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.deadline}
                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Launch Project</button>
                </form>
            </div>
        </div>
    );
}

function TaskModal({ projectId, onClose, onCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        estimated_hours: 2,
        impact_score: 3,
        effort_score: 3,
        deadline: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/projects/${projectId}/tasks`, {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            });
            onCreated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div className="glass" style={{ width: '500px' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>New Task</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        required
                        className="input"
                        placeholder="What needs to be done?"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Est. Hours</label>
                            <input type="number" className="input" value={formData.estimated_hours} onChange={e => setFormData({ ...formData, estimated_hours: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Impact (1-5)</label>
                            <input type="number" min="1" max="5" className="input" value={formData.impact_score} onChange={e => setFormData({ ...formData, impact_score: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Effort (1-5)</label>
                            <input type="number" min="1" max="5" className="input" value={formData.effort_score} onChange={e => setFormData({ ...formData, effort_score: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Local Deadline (Optional)</label>
                            <input type="date" className="input" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function GuidanceModal({ task, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div className="glass" style={{ width: '500px', border: '1px solid var(--accent-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent-secondary)' }}>Execution Guidance</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                </div>

                <h2 style={{ marginBottom: '1rem' }}>{task.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {task.description}
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Step-by-Step Instructions
                    </h4>
                    {task.guidance ? (
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                            {task.guidance}
                        </div>
                    ) : (
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            No specific guidance provided yet. Use the ChatGPT prompt to generate actionable steps for this task.
                        </p>
                    )}
                </div>

                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>
                    Got it, let's work
                </button>
            </div>
        </div>
    );
}

export default App;
