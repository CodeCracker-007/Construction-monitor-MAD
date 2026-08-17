export type UserRole = 'manager' | 'engineer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  assignedEngineerId: string;
  status: TaskStatus;
  dueDate: string;
}

export interface ProgressUpdate {
  id: string;
  projectId: string;
  taskId: string;
  text: string;
  status: TaskStatus;
  imageUrl?: string;
  userName: string;
  userRole: UserRole;
  timestamp: string; // ISO String
}
