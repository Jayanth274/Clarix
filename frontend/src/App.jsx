import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import LandingPage from './pages/LandingPage';

import AnalyzerPage from './pages/AnalyzerPage';
import ComparisonPage from './pages/ComparisonPage';

import Dashboard from './components/Dashboard';
import RealTimeAlert from './components/RealTimeAlert';
import { predictFatigueIncrease } from './core/aiPredictionEngine';



// Alert Manager Component
function AlertManager() {
  const { metrics, trackingState } = useNavigation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !metrics.alertData) return null;

  const expectedIncrease = trackingState ?
    predictFatigueIncrease(trackingState, 3) : 0;

  return (
    <RealTimeAlert
      alertData={metrics.alertData}
      expectedIncrease={expectedIncrease}
      onDismiss={() => setDismissed(true)}
    />
  );
}

function App() {
  return (
    <Router>
      <NavigationProvider>
        <Dashboard />
        <AlertManager />
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/analyze" element={<AnalyzerPage />} />

          <Route path="/comparison" element={<ComparisonPage />} />


        </Routes>
      </NavigationProvider>
    </Router>
  );
}

export default App;
