import { create } from 'zustand';

/**
 * Application step type
 */
export type AppStep = 'upload' | 'review' | 'summary';

/**
 * Application global state
 */
interface AppState {
  currentStep: AppStep;
  sessionId: string;
  userId: string;

  // Actions
  setCurrentStep: (step: AppStep) => void;
  setSessionId: (id: string) => void;
  setUserId: (id: string) => void;
}

/**
 * Application state management Store
 */
export const useAppStore = create<AppState>((set) => ({
  currentStep: 'upload',
  sessionId: 'default_session',
  userId: 'default_user',

  setCurrentStep: (step) => set({ currentStep: step }),
  setSessionId: (id) => set({ sessionId: id }),
  setUserId: (id) => set({ userId: id }),
}));

