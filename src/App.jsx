import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DataProvider, AuthProvider, SubscriberAuthProvider, useSubscriberAuth } from './contexts';
import { ToastProvider } from './components/Common';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import Opportunities from './components/Opportunities';
import Inbox from './components/Inbox';
import Templates from './components/Templates';
import Prompts from './components/Prompts';
import CalendarView from './components/CalendarView';
import Research from './components/Research';
import Workflow from './components/Workflow';
import Settings from './components/Settings';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/** Tab registry — order matters for sidebar rendering */
const TABS = [
  { id: 'dashboard',     label: 'Dashboard',       icon: 'Home' },
  { id: 'pipeline',      label: 'Pipeline',        icon: 'Columns3' },
  { id: 'opportunities', label: 'Opportunities',   icon: 'Briefcase' },
  { id: 'inbox',         label: 'Inbox',           icon: 'Mail' },
  { id: 'templates',     label: 'Reply Library',   icon: 'MessageSquareText' },
  { id: 'prompts',       label: 'Prompt Studio',   icon: 'Sparkles' },
  { id: 'calendar',      label: 'Calendar',        icon: 'CalendarDays' },
  { id: 'research',      label: 'Brand Research',  icon: 'Search' },
  { id: 'workflow',      label: 'Daily Workflow',   icon: 'ListChecks' },
  { id: 'settings',      label: 'Settings',        icon: 'Settings' },
];

/** Maps tab id → component */
const TAB_COMPONENTS = {
  dashboard:     Dashboard,
  pipeline:      Pipeline,
  opportunities: Opportunities,
  inbox:         Inbox,
  templates:     Templates,
  prompts:       Prompts,
  calendar:      CalendarView,
  research:      Research,
  workflow:      Workflow,
  settings:      Settings,
};

function AppInner() {
  const { subscriberEmail, subscriberLogin } = useSubscriberAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActiveComponent = TAB_COMPONENTS[activeTab] || Dashboard;

  if (!subscriberEmail) {
    return <LoginPage onLogin={subscriberLogin} />;
  }

  const inner = (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <Layout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
            <ActiveComponent onNavigate={setActiveTab} />
          </Layout>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );

  /* Wrap in GoogleOAuthProvider only when a client ID is configured */
  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}

export default function App() {
  return (
    <SubscriberAuthProvider>
      <AppInner />
    </SubscriberAuthProvider>
  );
}
