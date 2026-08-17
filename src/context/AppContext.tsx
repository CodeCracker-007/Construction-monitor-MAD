import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Project, Task, ProgressUpdate, UserRole, TaskStatus } from '../types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  updates: ProgressUpdate[];
  loading: boolean;
  login: (email: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  createProject: (projectData: Omit<Project, 'id' | 'completed'>) => Promise<void>;
  createTask: (taskData: Omit<Task, 'id'>) => Promise<void>;
  addProgressUpdate: (updateData: {
    projectId: string;
    taskId: string;
    text: string;
    status: TaskStatus;
    imageUrl?: string;
  }) => Promise<void>;
  getProjectProgress: (projectId: string) => number;
  getProjectTaskStats: (projectId: string) => { completed: number; total: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Users
const INITIAL_USERS: User[] = [
  { id: 'mgr-1', email: 'karthik@buildtrack.com', name: 'Karthik', role: 'manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
  { id: 'eng-1', email: 'arun@buildtrack.com', name: 'Arun', role: 'engineer', avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=120' },
  { id: 'eng-2', email: 'kumar@buildtrack.com', name: 'Kumar', role: 'engineer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120' }
];

// Initial Mock Projects
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Green Valley Apartments',
    description: 'Luxury residential apartment building with 20 floors and green common areas.',
    location: 'Chennai',
    startDate: '2026-01-10',
    endDate: '2026-12-25',
    completed: false
  },
  {
    id: 'proj-2',
    name: 'Office Building Project',
    description: '15-story commercial office tower featuring high-tech double glazed facades.',
    location: 'Bangalore',
    startDate: '2026-02-15',
    endDate: '2026-11-30',
    completed: false
  },
  {
    id: 'proj-3',
    name: 'Warehouse Renovation',
    description: 'Industrial storage warehouse flooring retrofitting, re-roofing, and docking bay installations.',
    location: 'Kochi',
    startDate: '2025-09-01',
    endDate: '2026-04-15',
    completed: true
  }
];

// Initial Tasks (20 for Project 1, 11 for Project 2, 5 for Project 3)
const INITIAL_TASKS: Task[] = [
  // Project 1 (Green Valley Apartments) - 13 completed, 3 in progress, 4 pending = 20 tasks (13/20 = 65%)
  ...Array.from({ length: 13 }, (_, i) => ({
    id: `task-1-c${i + 1}`,
    projectId: 'proj-1',
    name: [
      'Site Clearing & Excavation',
      'Geotechnical Soil Analysis',
      'Foundation Footing & Rebar Grid',
      'Substructure Concrete Pouring',
      'Plinth Beam Reinforcement',
      'Anti-termite Soil Treatment',
      'Ground Floor Column Casting',
      'Ground Floor Brick Masonry',
      'Ground Floor Slab Shuttering',
      'First Floor Columns Formwork',
      'First Floor Brickwork Masonry',
      'First Floor Plumbing Line Layout',
      'Ground Floor Interior Plastering'
    ][i] || `Completed Structural Task ${i + 1}`,
    description: 'Completed according to standard structural design specifications.',
    assignedEngineerId: i % 2 === 0 ? 'eng-1' : 'eng-2',
    status: 'completed' as TaskStatus,
    dueDate: '2026-06-30'
  })),
  {
    id: 'task-1-ip1',
    projectId: 'proj-1',
    name: 'Second Floor Slab Casting',
    description: 'Setting shuttering and placing rebar mesh for the second-floor ceiling.',
    assignedEngineerId: 'eng-1',
    status: 'in_progress',
    dueDate: '2026-08-15'
  },
  {
    id: 'task-1-ip2',
    projectId: 'proj-1',
    name: 'Electrical Conduit Pipe Layout',
    description: 'Laying out flexible pipes inside slab reinforcements.',
    assignedEngineerId: 'eng-2',
    status: 'in_progress',
    dueDate: '2026-08-20'
  },
  {
    id: 'task-1-ip3',
    projectId: 'proj-1',
    name: 'Water Storage Tank Masonry',
    description: 'Constructing brick walls for underground water storage tank.',
    assignedEngineerId: 'eng-1',
    status: 'in_progress',
    dueDate: '2026-08-25'
  },
  {
    id: 'task-1-p1',
    projectId: 'proj-1',
    name: 'Interior Wall Finish & Plastering',
    description: 'Applying smooth plastering on interior brick walls.',
    assignedEngineerId: 'eng-1',
    status: 'pending',
    dueDate: '2026-09-30'
  },
  {
    id: 'task-1-p2',
    projectId: 'proj-1',
    name: 'Floor Tiling & Finishing Work',
    description: 'Laying vitrified tiles in flats and granite in corridors.',
    assignedEngineerId: 'eng-2',
    status: 'pending',
    dueDate: '2026-10-31'
  },
  {
    id: 'task-1-p3',
    projectId: 'proj-1',
    name: 'UPVC Window Glazing & Fitting',
    description: 'Installing double glazed sliding windows in bedrooms.',
    assignedEngineerId: 'eng-1',
    status: 'pending',
    dueDate: '2026-11-15'
  },
  {
    id: 'task-1-p4',
    projectId: 'proj-1',
    name: 'External Painting & Cladding',
    description: 'Applying weather-proof exterior grade emulsion paint.',
    assignedEngineerId: 'eng-2',
    status: 'pending',
    dueDate: '2026-12-15'
  },

  // Project 2 (Office Building Project) - 9 completed, 1 in progress, 1 pending = 11 tasks (9/11 = 82%)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `task-2-c${i + 1}`,
    projectId: 'proj-2',
    name: [
      'Site Survey & Foundation Grids',
      'Deep Pile Foundation Drilling',
      'Basement Retaining Wall Casting',
      'Drainage Infrastructure Layout',
      'Structural Steel Columns Layout',
      'Main Core Lift Shaft Casting',
      'Ground Floor Decking Sheet Fitting',
      'Ground Floor Concrete Slab Cast',
      'Elevator Machinery Platform Lift'
    ][i] || `Office Completed Task ${i + 1}`,
    description: 'Task inspected and approved by Project Architect.',
    assignedEngineerId: i % 2 === 0 ? 'eng-2' : 'eng-1',
    status: 'completed' as TaskStatus,
    dueDate: '2026-05-15'
  })),
  {
    id: 'task-2-ip1',
    projectId: 'proj-2',
    name: 'Curtain Wall Facade Glazing',
    description: 'Mounting reflective glass panels on outer aluminum frame.',
    assignedEngineerId: 'eng-2',
    status: 'in_progress',
    dueDate: '2026-08-30'
  },
  {
    id: 'task-2-p1',
    projectId: 'proj-2',
    name: 'HVAC Air Ducting System',
    description: 'Hanging galvanized steel ducts for central air conditioning.',
    assignedEngineerId: 'eng-1',
    status: 'pending',
    dueDate: '2026-09-30'
  },

  // Project 3 (Warehouse Renovation) - 5 completed = 5 tasks
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `task-3-c${i + 1}`,
    projectId: 'proj-3',
    name: [
      'Roof Truss Steel Welding Work',
      'High-durability Epoxy Floor Coating',
      'Electrical Power Panels Layout',
      'Hydraulic Dock Leveler Fitment',
      'Ceiling Fire Sprinkler Piping'
    ][i] || `Renovation Task ${i + 1}`,
    description: 'Warehouse renovation task fully executed.',
    assignedEngineerId: 'eng-1',
    status: 'completed' as TaskStatus,
    dueDate: '2026-03-31'
  }))
];

// Initial Progress Updates - references 'foundation', 'columns', 'brickwork'
const INITIAL_UPDATES: ProgressUpdate[] = [
  {
    id: 'update-1',
    projectId: 'proj-1',
    taskId: 'task-1-c4',
    text: 'Foundation concrete work fully poured and leveled. Structural cubes cast for concrete strength verification testing.',
    status: 'completed',
    imageUrl: 'foundation',
    userName: 'Arun',
    userRole: 'engineer',
    timestamp: '2026-07-24T10:30:00.000Z'
  },
  {
    id: 'update-2',
    projectId: 'proj-1',
    taskId: 'task-1-c10',
    text: 'Formwork support structures erect for first-floor main load-bearing columns. Ready for inspection.',
    status: 'completed',
    imageUrl: 'columns',
    userName: 'Kumar',
    userRole: 'engineer',
    timestamp: '2026-07-24T09:15:00.000Z'
  },
  {
    id: 'update-3',
    projectId: 'proj-1',
    taskId: 'task-1-c11',
    text: 'First-floor fly ash brick wall masonry completed for Wing A apartments. Window opening frames set.',
    status: 'completed',
    imageUrl: 'brickwork',
    userName: 'Arun',
    userRole: 'engineer',
    timestamp: '2026-07-23T16:00:00.000Z'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('bt_current_user');
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Failed to parse current user', e);
          }
        }
        
        const savedUsers = await AsyncStorage.getItem('bt_users');
        if (savedUsers) {
          try {
            setUsers(JSON.parse(savedUsers));
          } catch (e) {
            console.error('Failed to parse users list, resetting', e);
            setUsers(INITIAL_USERS);
            await AsyncStorage.setItem('bt_users', JSON.stringify(INITIAL_USERS));
          }
        } else {
          setUsers(INITIAL_USERS);
          await AsyncStorage.setItem('bt_users', JSON.stringify(INITIAL_USERS));
        }

        const savedProjects = await AsyncStorage.getItem('bt_projects');
        if (savedProjects) {
          try {
            setProjects(JSON.parse(savedProjects));
          } catch (e) {
            console.error('Failed to parse projects list, resetting', e);
            setProjects(INITIAL_PROJECTS);
            await AsyncStorage.setItem('bt_projects', JSON.stringify(INITIAL_PROJECTS));
          }
        } else {
          setProjects(INITIAL_PROJECTS);
          await AsyncStorage.setItem('bt_projects', JSON.stringify(INITIAL_PROJECTS));
        }

        const savedTasks = await AsyncStorage.getItem('bt_tasks');
        if (savedTasks) {
          try {
            setTasks(JSON.parse(savedTasks));
          } catch (e) {
            console.error('Failed to parse tasks list, resetting', e);
            setTasks(INITIAL_TASKS);
            await AsyncStorage.setItem('bt_tasks', JSON.stringify(INITIAL_TASKS));
          }
        } else {
          setTasks(INITIAL_TASKS);
          await AsyncStorage.setItem('bt_tasks', JSON.stringify(INITIAL_TASKS));
        }

        const savedUpdates = await AsyncStorage.getItem('bt_updates');
        if (savedUpdates) {
          try {
            setUpdates(JSON.parse(savedUpdates));
          } catch (e) {
            console.error('Failed to parse updates feed, resetting', e);
            setUpdates(INITIAL_UPDATES);
            await AsyncStorage.setItem('bt_updates', JSON.stringify(INITIAL_UPDATES));
          }
        } else {
          setUpdates(INITIAL_UPDATES);
          await AsyncStorage.setItem('bt_updates', JSON.stringify(INITIAL_UPDATES));
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    const matchedUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );
    if (matchedUser) {
      setCurrentUser(matchedUser);
      await AsyncStorage.setItem('bt_current_user', JSON.stringify(matchedUser));
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, role: UserRole): Promise<boolean> => {
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) return false;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    await AsyncStorage.setItem('bt_users', JSON.stringify(updatedUsers));
    await AsyncStorage.setItem('bt_current_user', JSON.stringify(newUser));
    return true;
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem('bt_current_user');
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'completed'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      completed: false
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    await AsyncStorage.setItem('bt_projects', JSON.stringify(updated));
  };

  const createTask = async (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    await AsyncStorage.setItem('bt_tasks', JSON.stringify(updated));
  };

  const addProgressUpdate = async (updateData: {
    projectId: string;
    taskId: string;
    text: string;
    status: TaskStatus;
    imageUrl?: string;
  }) => {
    if (!currentUser) return;

    const newUpdate: ProgressUpdate = {
      id: `update-${Date.now()}`,
      projectId: updateData.projectId,
      taskId: updateData.taskId,
      text: updateData.text,
      status: updateData.status,
      imageUrl: updateData.imageUrl,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString()
    };

    const updatedUpdates = [newUpdate, ...updates];
    setUpdates(updatedUpdates);
    await AsyncStorage.setItem('bt_updates', JSON.stringify(updatedUpdates));

    // Update tasks
    const updatedTasks = tasks.map(t =>
      t.id === updateData.taskId ? { ...t, status: updateData.status } : t
    );
    setTasks(updatedTasks);
    await AsyncStorage.setItem('bt_tasks', JSON.stringify(updatedTasks));

    // Check project completion
    const projectTasks = updatedTasks.filter(t => t.projectId === updateData.projectId);
    const allCompleted = projectTasks.length > 0 && projectTasks.every(t => t.status === 'completed');
    
    const updatedProjects = projects.map(p =>
      p.id === updateData.projectId ? { ...p, completed: allCompleted } : p
    );
    setProjects(updatedProjects);
    await AsyncStorage.setItem('bt_projects', JSON.stringify(updatedProjects));
  };

  const getProjectTaskStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return { completed, total };
  };

  const getProjectProgress = (projectId: string): number => {
    const { completed, total } = getProjectTaskStats(projectId);
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        projects,
        tasks,
        updates,
        loading,
        login,
        register,
        logout,
        createProject,
        createTask,
        addProgressUpdate,
        getProjectProgress,
        getProjectTaskStats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
