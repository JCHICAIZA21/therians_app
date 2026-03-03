import { Navigate, Route, Routes } from 'react-router-dom';
import { OnboardingPage } from '../modules/onboarding.page';
import { MatchingPage } from '../modules/matching.page';
import { ChatPage } from '../modules/chat.page';
import { LoginPage } from '../modules/auth/login.page';
import { RegisterPage } from '../modules/auth/register.page';
import { PetListingPage } from '../modules/pets/pet-listing.page';
import { PetDetailPage } from '../modules/pets/pet-detail.page';
import { PartnerDashboardPage } from '../modules/partner/partner-dashboard.page';
import { PetFormPage } from '../modules/partner/pet-form.page';
import { ConversationPage } from '../modules/messages/conversation.page';
import { ProtectedRoute } from '../shared/protected-route';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pets" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/matching" element={<MatchingPage />} />
      <Route path="/chat" element={<ChatPage />} />

      {/* Adopción / Animales */}
      <Route path="/pets" element={<PetListingPage />} />
      <Route path="/pets/:id" element={<PetDetailPage />} />

      {/* Mensajes de usuario */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard de veterinaria */}
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedRoute requiredRole="PARTNER">
            <PartnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/pets/new"
        element={
          <ProtectedRoute requiredRole="PARTNER">
            <PetFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/pets/:id/edit"
        element={
          <ProtectedRoute requiredRole="PARTNER">
            <PetFormPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
