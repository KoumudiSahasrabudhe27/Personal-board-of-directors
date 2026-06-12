import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import BoardSession from './pages/BoardSession';

const App = () => {
  const [view, setView] = useState('landing');

  if (view === 'session') {
    return <BoardSession onBack={() => setView('landing')} />;
  }

  return <LandingPage onStart={() => setView('session')} />;
};

export default App;
