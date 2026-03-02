import { Navigate, Route, Routes } from 'react-router-dom';
import { OnboardingPage } from '../modules/onboarding.page';
import { MatchingPage } from '../modules/matching.page';
import { ChatPage } from '../modules/chat.page';
import { AdoptionPage } from '../modules/adoption.page';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/matching" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/matching" element={<MatchingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/adoption" element={<AdoptionPage />} />
    </Routes>
  );
}
