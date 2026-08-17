import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Modal, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  KeyboardAvoidingView, 
  StatusBar,
  FlatList,
  Pressable
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppProvider, useApp } from './src/context/AppContext';
import type { Task, Project, TaskStatus, UserRole } from './src/types';

// Resolve image assets locally
const foundationImg = require('./assets/foundation.jpg');
const columnsImg = require('./assets/columns.jpg');
const brickworkImg = require('./assets/brickwork.jpg');

export const resolveImageSource = (imageUrl: string) => {
  if (imageUrl === 'foundation') return foundationImg;
  if (imageUrl === 'columns') return columnsImg;
  if (imageUrl === 'brickwork') return brickworkImg;
  return { uri: imageUrl };
};

export default function AppEntry() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
          <App />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const { 
    currentUser, 
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
  } = useApp();

  // Screen routing state
  const [activeScreen, setActiveScreen] = useState<'splash' | 'login' | 'register' | 'main'>('splash');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'updates' | 'profile'>('dashboard');
  
  // Project detail sub-view
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailsTab, setProjectDetailsTab] = useState<'tasks' | 'updates' | 'photos'>('tasks');

  // Modals open states
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  
  // Specific task selected for update
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);

  // Form input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('manager');
  const [loginError, setLoginError] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('manager');
  const [registerError, setRegisterError] = useState('');

  // Create Project inputs
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projLoc, setProjLoc] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');

  // Create Task inputs
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Add Progress Update inputs
  const [updateText, setUpdateText] = useState('');
  const [updateStatus, setUpdateStatus] = useState<TaskStatus>('in_progress');
  const [updateImage, setUpdateImage] = useState<string>('');
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);

  // Project list filter
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Splash Screen Timer
  useEffect(() => {
    if (activeScreen === 'splash' && !loading) {
      const timer = setTimeout(() => {
        if (currentUser) {
          setActiveScreen('main');
        } else {
          setActiveScreen('login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeScreen, loading, currentUser]);

  // Navigate to login if logout occurs
  useEffect(() => {
    if (!currentUser && activeScreen === 'main') {
      setActiveScreen('login');
    }
  }, [currentUser, activeScreen]);

  // Reset errors on page switches
  useEffect(() => {
    setLoginError('');
    setRegisterError('');
  }, [activeScreen]);

  const handleLogin = async () => {
    if (!loginEmail) {
      setLoginError('Email address is required');
      return;
    }
    const success = await login(loginEmail, loginRole);
    if (success) {
      setActiveScreen('main');
      setLoginEmail('');
    } else {
      setLoginError('Account not found. Presets: karthik@buildtrack.com (Manager), arun@buildtrack.com (Engineer).');
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerEmail) {
      setRegisterError('All fields are required');
      return;
    }
    const success = await register(registerName, registerEmail, registerRole);
    if (success) {
      setActiveScreen('main');
      setRegisterName('');
      setRegisterEmail('');
    } else {
      setRegisterError('Email address already exists.');
    }
  };

  const handleCreateProject = async () => {
    if (!projName || !projLoc || !projStart || !projEnd) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }
    await createProject({
      name: projName,
      description: projDesc,
      location: projLoc,
      startDate: projStart,
      endDate: projEnd
    });
    // Reset Form
    setProjName('');
    setProjDesc('');
    setProjLoc('');
    setProjStart('');
    setProjEnd('');
    setIsCreateProjectOpen(false);
  };

  const handleCreateTask = async () => {
    if (!selectedProjectId) return;
    if (!taskName || !taskAssignee || !taskDueDate) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }
    await createTask({
      projectId: selectedProjectId,
      name: taskName,
      description: taskDesc,
      assignedEngineerId: taskAssignee,
      status: 'pending',
      dueDate: taskDueDate
    });
    // Reset Form
    setTaskName('');
    setTaskDesc('');
    setTaskAssignee('');
    setTaskDueDate('');
    setIsCreateTaskOpen(false);
  };

  const handleAddProgressUpdate = async () => {
    if (!selectedProjectId || !selectedTaskForUpdate) return;
    if (!updateText) {
      Alert.alert('Error', 'Please enter a description of today\'s progress');
      return;
    }

    const finalImage = customImageUri || updateImage;

    await addProgressUpdate({
      projectId: selectedProjectId,
      taskId: selectedTaskForUpdate.id,
      text: updateText,
      status: updateStatus,
      imageUrl: finalImage || undefined
    });

    // Reset Form
    setUpdateText('');
    setUpdateImage('');
    setCustomImageUri(null);
    setSelectedTaskForUpdate(null);
    setIsAddUpdateOpen(false);
  };

  // Launch camera / gallery via Expo Image Picker
  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to enable camera/gallery permissions.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCustomImageUri(result.assets[0].uri);
      setUpdateImage(''); // Clear preset selection
    }
  };

  // Helper date layout functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTimeAgo = (isoStr: string) => {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // KPI states calculations
  const activeProjects = projects.filter(p => !p.completed);
  const completedProjects = projects.filter(p => p.completed);
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const overallProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Selected Project Details
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const currentProjectTasks = selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : [];
  const currentProjectUpdates = selectedProjectId ? updates.filter(u => u.projectId === selectedProjectId) : [];
  const currentProjectPhotos = currentProjectUpdates.filter(u => u.imageUrl);

  // Filtering projects
  const filteredProjects = projects.filter(p => {
    if (projectFilter === 'active') return !p.completed;
    if (projectFilter === 'completed') return p.completed;
    return true;
  });

  const isEngineerAssignedToProject = (project: Project) => {
    if (!currentUser) return false;
    if (currentUser.role === 'manager') return true; // Manager sees all
    
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    return projectTasks.some(t => t.assignedEngineerId === currentUser.id);
  };

  const siteEngineers = useApp().users.filter(u => u.role === 'engineer');

  if (loading || activeScreen === 'splash') {
    return (
      <View style={styles.splashScreen}>
        <View style={styles.splashContent}>
          <View style={styles.splashLogoContainer}>
            <Ionicons name="construct" size={54} color="white" />
          </View>
          <Text style={styles.splashTitle}>SiteMonitor</Text>
          <Text style={styles.splashTagline}>Build. Track. Complete.</Text>
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 20 }} />
          <TouchableOpacity 
            style={styles.splashSkipBtn} 
            onPress={() => setActiveScreen(currentUser ? 'main' : 'login')}
          >
            <Text style={styles.splashSkipText}>Skip Splash</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (activeScreen === 'login' || activeScreen === 'register') {
    return (
      <KeyboardAvoidingView 
        style={styles.authContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <View style={styles.authLogo}>
                <Ionicons name="construct" size={28} color="#f97316" />
              </View>
              <Text style={styles.authTitle}>Construction Site Monitor</Text>
              <Text style={styles.authSubtitle}>
                {activeScreen === 'login' ? 'Sign in to monitor progress' : 'Create an MVP monitor account'}
              </Text>
            </View>

            {activeScreen === 'login' ? (
              <View>
                {loginError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{loginError}</Text>
                  </View>
                ) : null}

                <Text style={styles.formLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="karthik@buildtrack.com"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                  />
                </View>
                <Text style={styles.presetsNote}>
                  Presets: <Text style={{fontWeight:'700'}}>karthik@buildtrack.com</Text> (Manager), <Text style={{fontWeight:'700'}}>arun@buildtrack.com</Text> (Engineer)
                </Text>

                <Text style={styles.formLabel}>Sign in as Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity 
                    style={[styles.roleOption, loginRole === 'manager' && styles.roleOptionActive]}
                    onPress={() => setLoginRole('manager')}
                  >
                    <Ionicons name="briefcase" size={20} color={loginRole === 'manager' ? '#f97316' : '#64748b'} />
                    <Text style={[styles.roleOptionText, loginRole === 'manager' && styles.roleOptionTextActive]}>Manager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, loginRole === 'engineer' && styles.roleOptionActive]}
                    onPress={() => setLoginRole('engineer')}
                  >
                    <Ionicons name="hammer" size={20} color={loginRole === 'engineer' ? '#f97316' : '#64748b'} />
                    <Text style={[styles.roleOptionText, loginRole === 'engineer' && styles.roleOptionTextActive]}>Engineer</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.authBtn} onPress={handleLogin}>
                  <Text style={styles.authBtnText}>Login</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setActiveScreen('register')}>
                  <Text style={styles.authFooterLink}>Don't have an account? <Text style={{color: '#f97316', fontWeight: '600'}}>Create Account</Text></Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {registerError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{registerError}</Text>
                  </View>
                ) : null}

                <Text style={styles.formLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Karthik Kumar"
                    placeholderTextColor="#94a3b8"
                    value={registerName}
                    onChangeText={setRegisterName}
                  />
                </View>

                <Text style={styles.formLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="name@buildtrack.com"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                  />
                </View>

                <Text style={styles.formLabel}>Select Account Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity 
                    style={[styles.roleOption, registerRole === 'manager' && styles.roleOptionActive]}
                    onPress={() => setRegisterRole('manager')}
                  >
                    <Ionicons name="briefcase" size={20} color={registerRole === 'manager' ? '#f97316' : '#64748b'} />
                    <Text style={[styles.roleOptionText, registerRole === 'manager' && styles.roleOptionTextActive]}>Manager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, registerRole === 'engineer' && styles.roleOptionActive]}
                    onPress={() => setRegisterRole('engineer')}
                  >
                    <Ionicons name="hammer" size={20} color={registerRole === 'engineer' ? '#f97316' : '#64748b'} />
                    <Text style={[styles.roleOptionText, registerRole === 'engineer' && styles.roleOptionTextActive]}>Engineer</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.authBtn} onPress={handleRegister}>
                  <Text style={styles.authBtnText}>Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setActiveScreen('login')}>
                  <Text style={styles.authFooterLink}>Already have an account? <Text style={{color: '#f97316', fontWeight: '600'}}>Login</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.mainAppContainer}>
      
      {/* 1. HEADER BAR */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>
            {selectedProjectId ? 'Project Details' : 'Construction Monitor'}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedProjectId ? currentProject?.name : (
              activeTab === 'dashboard' ? 'Dashboard' :
              activeTab === 'projects' ? 'My Projects' :
              activeTab === 'updates' ? 'Updates Feed' : 'My Profile'
            )}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {currentUser?.role === 'manager' ? 'PM' : 'Engineer'}
          </Text>
        </View>
      </View>

      {/* 2. BODY CONTENT PANEL */}
      <View style={styles.body}>
        
        {/* ============ SCREEN A: DASHBOARD ============ */}
        {activeTab === 'dashboard' && !selectedProjectId && (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            {/* Overall Progress Banner */}
            <View style={styles.progressBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.progressBannerGreeting}>Good Morning, {currentUser?.name} 👋</Text>
                <Text style={styles.progressBannerLabel}>Overall Site Progress</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBar, { width: `${overallProgress}%`, backgroundColor: '#f97316' }]} />
                </View>
                <Text style={styles.progressBannerSub}>{overallProgress}% completed across all tasks</Text>
              </View>
              <View style={styles.progressCircularContainer}>
                <Text style={styles.progressCircularValue}>{overallProgress}%</Text>
              </View>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="business" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.metricValue}>{activeProjects.length}</Text>
                <Text style={styles.metricLabel}>Active</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.metricValue}>{completedProjects.length}</Text>
                <Text style={styles.metricLabel}>Completed</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="checkbox" size={20} color="#d97706" />
                </View>
                <Text style={styles.metricValue}>{completedTasksCount}/{totalTasksCount}</Text>
                <Text style={styles.metricLabel}>Tasks Done</Text>
              </View>
            </View>

            {/* Recent Projects Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Projects</Text>
              <TouchableOpacity onPress={() => setActiveTab('projects')}>
                <Text style={styles.sectionLink}>See All</Text>
              </TouchableOpacity>
            </View>

            {projects.slice(0, 2).map(p => {
              const progress = getProjectProgress(p.id);
              const { completed, total } = getProjectTaskStats(p.id);
              return (
                <TouchableOpacity 
                  key={p.id} 
                  style={styles.projectCard}
                  onPress={() => { setSelectedProjectId(p.id); setProjectDetailsTab('tasks'); }}
                >
                  <View style={styles.projectCardHeader}>
                    <View>
                      <Text style={styles.projectName}>{p.name}</Text>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.projectLocation}>{p.location}</Text>
                      </View>
                    </View>
                    <View style={[styles.badge, p.completed ? styles.badgeSuccess : styles.badgeActive]}>
                      <Text style={[styles.badgeText, p.completed ? styles.badgeTextSuccess : styles.badgeTextActive]}>
                        {p.completed ? 'Completed' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.projectCardProgress}>
                    <View style={styles.progressRowLabel}>
                      <Text style={styles.progressTextLabel}>Tasks Progress</Text>
                      <Text style={styles.progressValueText}>{progress}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { height: 6 }]}>
                      <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.projectCardFooter}>{completed} of {total} Tasks Finished</Text>
                </TouchableOpacity>
              );
            })}

            {/* Recent site updates list */}
            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Recent updates</Text>
            {updates.slice(0, 2).map(u => {
              const proj = projects.find(p => p.id === u.projectId);
              return (
                <View key={u.id} style={styles.compactUpdateCard}>
                  <View style={styles.compactUpdateHeader}>
                    <Text style={styles.compactUpdateProject}>{proj?.name}</Text>
                    <Text style={styles.compactUpdateTime}>{formatTimeAgo(u.timestamp)}</Text>
                  </View>
                  <Text style={styles.compactUpdateText}>
                    {u.imageUrl ? '📷 ' : ''}{u.text}
                  </Text>
                  <View style={styles.compactUpdateFooter}>
                    <Text style={styles.compactUpdateAuthor}>By {u.userName}</Text>
                    <View style={[styles.badge, u.status === 'completed' ? styles.badgeSuccess : styles.badgeActive, { transform: [{ scale: 0.85 }] }]}>
                      <Text style={u.status === 'completed' ? styles.badgeTextSuccess : styles.badgeTextActive}>
                        {u.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ============ SCREEN B: PROJECTS ============ */}
        {activeTab === 'projects' && !selectedProjectId && (
          <View style={{ flex: 1 }}>
            {/* Filter pills & Action buttons */}
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <TouchableOpacity 
                  style={[styles.filterPill, projectFilter === 'all' && styles.filterPillActive]}
                  onPress={() => setProjectFilter('all')}
                >
                  <Text style={[styles.filterPillText, projectFilter === 'all' && styles.filterPillTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterPill, projectFilter === 'active' && styles.filterPillActive]}
                  onPress={() => setProjectFilter('active')}
                >
                  <Text style={[styles.filterPillText, projectFilter === 'active' && styles.filterPillTextActive]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterPill, projectFilter === 'completed' && styles.filterPillActive]}
                  onPress={() => setProjectFilter('completed')}
                >
                  <Text style={[styles.filterPillText, projectFilter === 'completed' && styles.filterPillTextActive]}>Completed</Text>
                </TouchableOpacity>
              </ScrollView>
              
              {currentUser?.role === 'manager' && (
                <TouchableOpacity 
                  style={styles.headerAddBtn}
                  onPress={() => setIsCreateProjectOpen(true)}
                >
                  <Ionicons name="add" size={18} color="white" />
                  <Text style={styles.headerAddBtnText}>Create</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollPadding}>
              {filteredProjects.map(p => {
                const progress = getProjectProgress(p.id);
                const { completed, total } = getProjectTaskStats(p.id);
                const isAssigned = isEngineerAssignedToProject(p);
                
                if (!isAssigned) return null;

                return (
                  <TouchableOpacity 
                    key={p.id} 
                    style={styles.projectCard}
                    onPress={() => { setSelectedProjectId(p.id); setProjectDetailsTab('tasks'); }}
                  >
                    <View style={styles.projectCardHeader}>
                      <View>
                        <Text style={styles.projectName}>{p.name}</Text>
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                          <Text style={styles.projectLocation}>{p.location}</Text>
                        </View>
                      </View>
                      <View style={[styles.badge, p.completed ? styles.badgeSuccess : styles.badgeActive]}>
                        <Text style={[styles.badgeText, p.completed ? styles.badgeTextSuccess : styles.badgeTextActive]}>
                          {p.completed ? 'Completed' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.projectDesc} numberOfLines={2}>{p.description}</Text>

                    <View style={styles.projectCardProgress}>
                      <View style={styles.progressRowLabel}>
                        <Text style={styles.progressTextLabel}>Overall Progress</Text>
                        <Text style={styles.progressValueText}>{progress}%</Text>
                      </View>
                      <View style={[styles.progressBarBg, { height: 6 }]}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                      </View>
                    </View>
                    
                    <View style={styles.projectCardDivider} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.projectCardFooter}>{completed} / {total} Tasks Completed</Text>
                      <Text style={styles.viewDetailsText}>Open Details →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ============ SCREEN C: PROJECT DETAILS ============ */}
        {selectedProjectId && currentProject && (
          <View style={{ flex: 1 }}>
            {/* Header / Info box */}
            <View style={styles.detailsHeaderCard}>
              <TouchableOpacity 
                style={styles.backBtn}
                onPress={() => { setSelectedProjectId(null); }}
              >
                <Ionicons name="arrow-back" size={18} color="#64748b" />
                <Text style={styles.backBtnText}>Back to Projects</Text>
              </TouchableOpacity>
              
              <Text style={styles.detailsProjectName}>{currentProject.name}</Text>
              <View style={styles.detailsMetaRow}>
                <View style={styles.detailsMetaItem}>
                  <Ionicons name="location" size={14} color="#f97316" />
                  <Text style={styles.detailsMetaText}>{currentProject.location}</Text>
                </View>
                <View style={styles.detailsMetaItem}>
                  <Ionicons name="calendar" size={14} color="#64748b" />
                  <Text style={styles.detailsMetaText}>{formatDate(currentProject.startDate)} - {formatDate(currentProject.endDate)}</Text>
                </View>
              </View>

              <View style={{ marginTop: 15 }}>
                <View style={styles.progressRowLabel}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>Project Progress</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#f97316' }}>{getProjectProgress(currentProject.id)}%</Text>
                </View>
                <View style={[styles.progressBarBg, { height: 8 }]}>
                  <View style={[styles.progressBar, { width: `${getProjectProgress(currentProject.id)}%` }]} />
                </View>
              </View>
            </View>

            {/* Tabs Selector */}
            <View style={styles.segmentedTabWrapper}>
              <TouchableOpacity 
                style={[styles.segmentedTab, projectDetailsTab === 'tasks' && styles.segmentedTabActive]}
                onPress={() => setProjectDetailsTab('tasks')}
              >
                <Text style={[styles.segmentedTabText, projectDetailsTab === 'tasks' && styles.segmentedTabTextActive]}>Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentedTab, projectDetailsTab === 'updates' && styles.segmentedTabActive]}
                onPress={() => setProjectDetailsTab('updates')}
              >
                <Text style={[styles.segmentedTabText, projectDetailsTab === 'updates' && styles.segmentedTabTextActive]}>Updates</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentedTab, projectDetailsTab === 'photos' && styles.segmentedTabActive]}
                onPress={() => setProjectDetailsTab('photos')}
              >
                <Text style={[styles.segmentedTabText, projectDetailsTab === 'photos' && styles.segmentedTabTextActive]}>Photos</Text>
              </TouchableOpacity>
            </View>

            {/* Tab content wrapper */}
            {projectDetailsTab === 'tasks' && (
              <View style={{ flex: 1 }}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.subSectionTitle}>Tasks Checklist</Text>
                  {currentUser?.role === 'manager' && (
                    <TouchableOpacity 
                      style={styles.smallAddBtn}
                      onPress={() => setIsCreateTaskOpen(true)}
                    >
                      <Ionicons name="add" size={14} color="white" />
                      <Text style={styles.smallAddBtnText}>Add Task</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <ScrollView contentContainerStyle={styles.scrollPadding}>
                  {currentProjectTasks.map(t => {
                    const assignee = siteEngineers.find(eng => eng.id === t.assignedEngineerId)?.name || 'Unassigned';
                    const isMyTask = currentUser?.role === 'engineer' && t.assignedEngineerId === currentUser.id;
                    
                    return (
                      <TouchableOpacity 
                        key={t.id} 
                        style={styles.taskCard}
                        disabled={currentUser?.role !== 'engineer'}
                        onPress={() => {
                          setSelectedTaskForUpdate(t);
                          setUpdateStatus(t.status);
                          setIsAddUpdateOpen(true);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <View style={[styles.taskCheckbox, t.status === 'completed' && styles.taskCheckboxChecked, t.status === 'in_progress' && styles.taskCheckboxProgress]}>
                            {t.status === 'completed' && <Ionicons name="checkmark" size={14} color="white" />}
                            {t.status === 'in_progress' && <Ionicons name="time" size={14} color="white" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.taskCardName, t.status === 'completed' && styles.taskCardNameCompleted]}>
                              {t.name}
                            </Text>
                            <Text style={styles.taskCardDesc} numberOfLines={1}>{t.description}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                              <Text style={styles.taskCardAssignee}>Engineer: {assignee}</Text>
                              {isMyTask && (
                                <View style={styles.assignedToMeBadge}>
                                  <Text style={styles.assignedToMeBadgeText}>Assigned to Me</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.taskCardFooter}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                            <Text style={styles.taskCardDueDate}>Due {formatDate(t.dueDate)}</Text>
                          </View>
                          <View style={[styles.badge, t.status === 'completed' ? styles.badgeSuccess : t.status === 'in_progress' ? styles.badgeWarning : styles.badgePending]}>
                            <Text style={[styles.badgeText, t.status === 'completed' ? styles.badgeTextSuccess : t.status === 'in_progress' ? styles.badgeTextWarning : styles.badgeTextPending]}>
                              {t.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {projectDetailsTab === 'updates' && (
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollPadding}>
                  {currentUser?.role === 'engineer' && (
                    <TouchableOpacity 
                      style={styles.addUpdateBtnBlock}
                      onPress={() => {
                        const nextTask = currentProjectTasks.find(t => t.status !== 'completed') || currentProjectTasks[0] || null;
                        setSelectedTaskForUpdate(nextTask);
                        if (nextTask) setUpdateStatus(nextTask.status);
                        setIsAddUpdateOpen(true);
                      }}
                    >
                      <Ionicons name="add" size={18} color="white" />
                      <Text style={styles.addUpdateBtnBlockText}>Submit Progress Update</Text>
                    </TouchableOpacity>
                  )}

                  {currentProjectUpdates.map(u => {
                    const t = tasks.find(tk => tk.id === u.taskId);
                    return (
                      <View key={u.id} style={styles.feedCard}>
                        <View style={styles.feedCardHeader}>
                          <View>
                            <Text style={styles.feedCardAuthor}>{u.userName}</Text>
                            <Text style={styles.feedCardTime}>{formatTimeAgo(u.timestamp)}</Text>
                          </View>
                          <View style={[styles.badge, u.status === 'completed' ? styles.badgeSuccess : styles.badgeActive]}>
                            <Text style={u.status === 'completed' ? styles.badgeTextSuccess : styles.badgeTextActive}>
                              {u.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.feedCardText}>{u.text}</Text>
                        
                        <View style={styles.feedTaskIndicator}>
                          <Ionicons name="checkmark-done" size={14} color="#64748b" style={{ marginRight: 4 }} />
                          <Text style={styles.feedTaskText}>Task: {t?.name || 'General Progress'}</Text>
                        </View>

                        {u.imageUrl ? (
                          <Image 
                            source={resolveImageSource(u.imageUrl)} 
                            style={styles.feedPhoto}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {projectDetailsTab === 'photos' && (
              <ScrollView contentContainerStyle={styles.scrollPadding}>
                <View style={styles.photosGrid}>
                  {currentProjectPhotos.map(p => {
                    const t = tasks.find(tk => tk.id === p.taskId);
                    return (
                      <View key={p.id} style={styles.photoGridCard}>
                        <Image 
                          source={resolveImageSource(p.imageUrl!)} 
                          style={styles.photoGridImage}
                        />
                        <View style={styles.photoGridOverlay}>
                          <Text style={styles.photoGridTitle} numberOfLines={1}>{t?.name || 'General Progress'}</Text>
                          <Text style={styles.photoGridTime}>{formatDate(p.timestamp)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

          </View>
        )}

        {/* ============ SCREEN D: FEED UPDATES ============ */}
        {activeTab === 'updates' && !selectedProjectId && (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            {updates.map(u => {
              const p = projects.find(proj => proj.id === u.projectId);
              const t = tasks.find(tk => tk.id === u.taskId);
              return (
                <View key={u.id} style={styles.feedCard}>
                  <View style={styles.feedCardHeader}>
                    <View>
                      <Text style={styles.feedCardAuthor}>{u.userName}</Text>
                      <Text style={styles.feedCardTime}>{formatTimeAgo(u.timestamp)}</Text>
                    </View>
                    <View style={styles.feedCardProjectBadge}>
                      <Text style={styles.feedCardProjectBadgeText}>{p?.name}</Text>
                    </View>
                  </View>

                  <Text style={styles.feedCardText}>{u.text}</Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <View style={styles.feedTaskIndicator}>
                      <Ionicons name="checkmark-done" size={14} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.feedTaskText}>{t?.name}</Text>
                    </View>
                    <View style={[styles.badge, u.status === 'completed' ? styles.badgeSuccess : u.status === 'in_progress' ? styles.badgeWarning : styles.badgePending]}>
                      <Text style={[styles.badgeText, u.status === 'completed' ? styles.badgeTextSuccess : u.status === 'in_progress' ? styles.badgeTextWarning : styles.badgeTextPending]}>
                        {u.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  {u.imageUrl ? (
                    <Image 
                      source={resolveImageSource(u.imageUrl)} 
                      style={styles.feedPhoto}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ============ SCREEN E: PROFILE ============ */}
        {activeTab === 'profile' && !selectedProjectId && currentUser && (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            <View style={styles.profileCard}>
              <Image 
                source={{ uri: currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}` }} 
                style={styles.profileAvatar}
              />
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <View style={[styles.profileRoleBadge, currentUser.role === 'manager' ? styles.profileRoleManager : styles.profileRoleEngineer]}>
                <Text style={styles.profileRoleText}>{currentUser.role === 'manager' ? 'Project Manager' : 'Site Engineer'}</Text>
              </View>
              <Text style={styles.profileEmail}>{currentUser.email}</Text>

              <View style={styles.profileStatsRow}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNum}>
                    {currentUser.role === 'manager' 
                      ? projects.length 
                      : projects.filter(p => isEngineerAssignedToProject(p)).length
                    }
                  </Text>
                  <Text style={styles.profileStatLabel}>Projects</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNum}>
                    {currentUser.role === 'manager' 
                      ? tasks.length 
                      : tasks.filter(t => t.assignedEngineerId === currentUser.id).length
                    }
                  </Text>
                  <Text style={styles.profileStatLabel}>Assigned Tasks</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Offline Database Settings */}
            <View style={styles.settingsPanel}>
              <Text style={styles.settingsTitle}>Sync Settings</Text>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Offline Cache Database</Text>
                <Text style={[styles.settingsVal, { color: '#10b981' }]}>Local SQLite Active</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>App SDK Build</Text>
                <Text style={styles.settingsVal}>v57.0.0 (TS)</Text>
              </View>
            </View>
          </ScrollView>
        )}

      </View>

      {/* 3. BOTTOM TAB NAVIGATION BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => { setActiveTab('dashboard'); setSelectedProjectId(null); }}
        >
          <Ionicons name="analytics" size={22} color={activeTab === 'dashboard' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'dashboard' && styles.tabBtnTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => { setActiveTab('projects'); setSelectedProjectId(null); }}
        >
          <Ionicons name="business" size={22} color={activeTab === 'projects' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'projects' && styles.tabBtnTextActive]}>Projects</Text>
        </TouchableOpacity>

        {/* site engineers get a big middle CAMERA floating button to quickly report progress! */}
        {currentUser?.role === 'engineer' ? (
          <TouchableOpacity 
            style={styles.tabCameraBtn}
            onPress={() => {
              const myTasks = tasks.filter(t => t.assignedEngineerId === currentUser.id && t.status !== 'completed');
              const target = myTasks[0] || tasks.find(t => t.assignedEngineerId === currentUser.id) || null;
              if (target) {
                setSelectedProjectId(target.projectId);
                setSelectedTaskForUpdate(target);
                setUpdateStatus(target.status);
                setIsAddUpdateOpen(true);
              } else {
                Alert.alert('No Work Assigned', 'You do not have any active tasks assigned to report progress.');
              }
            }}
          >
            <Ionicons name="camera" size={26} color="white" />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => { setActiveTab('updates'); setSelectedProjectId(null); }}
        >
          <Ionicons name="time" size={22} color={activeTab === 'updates' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'updates' && styles.tabBtnTextActive]}>Updates</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => { setActiveTab('profile'); setSelectedProjectId(null); }}
        >
          <Ionicons name="person" size={22} color={activeTab === 'profile' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== MODALS ==================== */}

      {/* A. Create Project Modal (Managers Only) */}
      <Modal visible={isCreateProjectOpen} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Project</Text>
            <TouchableOpacity onPress={() => setIsCreateProjectOpen(false)}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.formLabel}>Project Name *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. Highway Flyover Phase 1" 
              value={projName}
              onChangeText={setProjName}
            />

            <Text style={styles.formLabel}>Description</Text>
            <TextInput 
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="Enter brief details..." 
              multiline
              value={projDesc}
              onChangeText={setProjDesc}
            />

            <Text style={styles.formLabel}>Location *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. Mumbai" 
              value={projLoc}
              onChangeText={setProjLoc}
            />

            <Text style={styles.formLabel}>Start Date (YYYY-MM-DD) *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="2026-08-01" 
              value={projStart}
              onChangeText={setProjStart}
            />

            <Text style={styles.formLabel}>Completion Date (YYYY-MM-DD) *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="2026-12-31" 
              value={projEnd}
              onChangeText={setProjEnd}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsCreateProjectOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateProject}>
              <Text style={styles.modalSubmitText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* B. Create Task Modal (Managers Only) */}
      <Modal visible={isCreateTaskOpen} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Project Task</Text>
            <TouchableOpacity onPress={() => setIsCreateTaskOpen(false)}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.formLabel}>Task Name *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. Excavation & Piling" 
              value={taskName}
              onChangeText={setTaskName}
            />

            <Text style={styles.formLabel}>Description</Text>
            <TextInput 
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} 
              placeholder="Enter details..." 
              multiline
              value={taskDesc}
              onChangeText={setTaskDesc}
            />

            <Text style={styles.formLabel}>Assign Site Engineer *</Text>
            <View style={styles.dropdownPicker}>
              {siteEngineers.map(e => (
                <TouchableOpacity 
                  key={e.id}
                  style={[styles.dropdownPickerItem, taskAssignee === e.id && styles.dropdownPickerItemActive]}
                  onPress={() => setTaskAssignee(e.id)}
                >
                  <Text style={[styles.dropdownPickerItemText, taskAssignee === e.id && styles.dropdownPickerItemTextActive]}>
                    {e.name} ({e.email})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Due Date (YYYY-MM-DD) *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="2026-09-15" 
              value={taskDueDate}
              onChangeText={setTaskDueDate}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsCreateTaskOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateTask}>
              <Text style={styles.modalSubmitText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* C. Add Progress Update Modal (Engineers Only) */}
      <Modal visible={isAddUpdateOpen} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Progress Update</Text>
            <TouchableOpacity onPress={() => setIsAddUpdateOpen(false)}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.taskSummaryBlock}>
              <Text style={styles.taskSummaryProject}>Project: {currentProject?.name}</Text>
              <Text style={styles.taskSummaryName}>Task: {selectedTaskForUpdate?.name}</Text>
            </View>

            <Text style={styles.formLabel}>Today's Progress Notes *</Text>
            <TextInput 
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="Enter work details..." 
              multiline
              value={updateText}
              onChangeText={setUpdateText}
            />

            <Text style={styles.formLabel}>Change Task Status *</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity 
                style={[styles.roleOption, updateStatus === 'pending' && styles.roleOptionActive]}
                onPress={() => setUpdateStatus('pending')}
              >
                <Text style={[styles.roleOptionText, updateStatus === 'pending' && styles.roleOptionTextActive]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleOption, updateStatus === 'in_progress' && styles.roleOptionActive]}
                onPress={() => setUpdateStatus('in_progress')}
              >
                <Text style={[styles.roleOptionText, updateStatus === 'in_progress' && styles.roleOptionTextActive]}>In Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleOption, updateStatus === 'completed' && styles.roleOptionActive]}
                onPress={() => setUpdateStatus('completed')}
              >
                <Text style={[styles.roleOptionText, updateStatus === 'completed' && styles.roleOptionTextActive]}>Completed</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Attach Progress Photo</Text>
            <View style={styles.photoUploaderBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 12 }}>
                <TouchableOpacity style={styles.photoSourceBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.photoSourceBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoSourceBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="image" size={20} color="white" />
                  <Text style={styles.photoSourceBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.simulatedPresetsLabel}>— OR SELECT SIMULATED PHOTO —</Text>
              <View style={styles.presetPhotoRow}>
                <TouchableOpacity 
                  style={[styles.presetPhotoBtn, updateImage === 'foundation' && styles.presetPhotoBtnActive]} 
                  onPress={() => { setUpdateImage('foundation'); setCustomImageUri(null); }}
                >
                  <Image source={foundationImg} style={styles.presetPhotoThumb} />
                  <Text style={styles.presetPhotoText}>Foundation</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.presetPhotoBtn, updateImage === 'columns' && styles.presetPhotoBtnActive]} 
                  onPress={() => { setUpdateImage('columns'); setCustomImageUri(null); }}
                >
                  <Image source={columnsImg} style={styles.presetPhotoThumb} />
                  <Text style={styles.presetPhotoText}>Columns</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.presetPhotoBtn, updateImage === 'brickwork' && styles.presetPhotoBtnActive]} 
                  onPress={() => { setUpdateImage('brickwork'); setCustomImageUri(null); }}
                >
                  <Image source={brickworkImg} style={styles.presetPhotoThumb} />
                  <Text style={styles.presetPhotoText}>Brickwork</Text>
                </TouchableOpacity>
              </View>
              
              {customImageUri ? (
                <Text style={styles.photoUploadedNote}>✓ Selected photo: {customImageUri.split('/').pop()?.substring(0, 24)}...</Text>
              ) : null}
              {updateImage ? (
                <Text style={styles.photoUploadedNote}>✓ Selected preset: {updateImage}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => {
                setUpdateText('');
                setUpdateImage('');
                setCustomImageUri(null);
                setSelectedTaskForUpdate(null);
                setIsAddUpdateOpen(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddProgressUpdate}>
              <Text style={styles.modalSubmitText}>Submit Update</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainAppContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  splashScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  splashLogoContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
    letterSpacing: -1,
  },
  splashTagline: {
    fontSize: 14,
    color: '#f97316',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
    fontWeight: '600',
  },
  splashSkipBtn: {
    marginTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
  },
  splashSkipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  authScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  formInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  presetsNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
  },
  roleOptionActive: {
    borderColor: '#f97316',
    backgroundColor: '#ffedd5',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  roleOptionTextActive: {
    color: '#f97316',
  },
  authBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  authBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  authFooterLink: {
    fontSize: 13,
    color: '#64748b',
  },
  header: {
    height: 70,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    maxWidth: 220,
  },
  headerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  headerBadgeText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  progressBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBannerGreeting: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBannerLabel: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 3,
  },
  progressBannerSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  progressCircularContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#f97316',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  progressCircularValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLink: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  projectLocation: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#ffedd5',
  },
  badgeSuccess: {
    backgroundColor: '#d1fae5',
  },
  badgeWarning: {
    backgroundColor: '#fef9c3',
  },
  badgePending: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeTextActive: {
    color: '#f97316',
  },
  badgeTextSuccess: {
    color: '#10b981',
  },
  badgeTextWarning: {
    color: '#d97706',
  },
  badgeTextPending: {
    color: '#64748b',
  },
  projectDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  projectCardProgress: {
    marginTop: 12,
  },
  progressRowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTextLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressValueText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  projectCardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  projectCardFooter: {
    fontSize: 11,
    color: '#64748b',
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#f97316',
    fontWeight: '600',
  },
  compactUpdateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  compactUpdateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactUpdateProject: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f97316',
  },
  compactUpdateTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  compactUpdateText: {
    fontSize: 13,
    color: '#1e293b',
    marginTop: 4,
    fontWeight: '500',
  },
  compactUpdateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
  },
  compactUpdateAuthor: {
    fontSize: 11,
    color: '#64748b',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 2,
  },
  headerAddBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsHeaderCard: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  detailsProjectName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailsMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  detailsMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  segmentedTabWrapper: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentedTabActive: {
    borderBottomWidth: 2.5,
    borderColor: '#f97316',
  },
  segmentedTabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  segmentedTabTextActive: {
    color: '#f97316',
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 2,
  },
  smallAddBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  taskCheckboxChecked: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  taskCheckboxProgress: {
    borderColor: '#f97316',
    backgroundColor: '#f97316',
  },
  taskCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  taskCardNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskCardDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  taskCardAssignee: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: '500',
  },
  assignedToMeBadge: {
    backgroundColor: '#ffedd5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
  },
  assignedToMeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f97316',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
  },
  taskCardDueDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  addUpdateBtnBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  addUpdateBtnBlockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  feedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  feedCardAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  feedCardTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  feedCardProjectBadge: {
    backgroundColor: '#ffedd5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  feedCardProjectBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f97316',
  },
  feedCardText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 18,
    fontWeight: '500',
  },
  feedTaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  feedTaskText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  feedPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoGridCard: {
    width: '48%',
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 6,
  },
  photoGridTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  photoGridTime: {
    color: '#cbd5e1',
    fontSize: 8,
    marginTop: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#f97316',
    backgroundColor: '#f1f5f9',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
  },
  profileRoleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  profileRoleManager: {
    backgroundColor: '#f1f5f9',
  },
  profileRoleEngineer: {
    backgroundColor: '#ffedd5',
  },
  profileRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  profileStatsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 20,
    paddingTop: 16,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
    width: '100%',
  },
  logoutBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsPanel: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingsLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  settingsVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  tabBar: {
    height: 65,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  tabBtnTextActive: {
    color: '#f97316',
    fontWeight: '700',
  },
  tabCameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    transform: [{ translateY: -10 }],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalBody: {
    padding: 16,
    paddingBottom: 40,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    height: 44,
    marginTop: 6,
    marginBottom: 12,
  },
  dropdownPicker: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 4,
    marginTop: 6,
    marginBottom: 12,
  },
  dropdownPickerItem: {
    padding: 10,
    borderRadius: 6,
  },
  dropdownPickerItemActive: {
    backgroundColor: '#ffedd5',
  },
  dropdownPickerItemText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  dropdownPickerItemTextActive: {
    color: '#f97316',
    fontWeight: '700',
  },
  modalFooter: {
    height: 70,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubmitBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  taskSummaryBlock: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  taskSummaryProject: {
    fontSize: 12,
    color: '#64748b',
  },
  taskSummaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  photoUploaderBox: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  photoSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    width: '45%',
  },
  photoSourceBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  simulatedPresetsLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  presetPhotoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  presetPhotoBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    backgroundColor: '#f8fafc',
  },
  presetPhotoBtnActive: {
    borderColor: '#f97316',
    backgroundColor: '#ffedd5',
  },
  presetPhotoThumb: {
    width: '100%',
    height: 50,
    borderRadius: 6,
  },
  presetPhotoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  photoUploadedNote: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 10,
  },
});
