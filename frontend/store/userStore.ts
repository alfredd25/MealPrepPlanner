import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DietType = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'pescatarian';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dietaryGoals: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    weightTarget?: {
      current: number;
      goal: number;
    };
  };
  dietType: DietType;
  allergies: string[];
  preferences: {
    cuisinePreferences: string[];
    maxPrepTime?: number;
    useFrozenIngredients: boolean;
    seasonalIngredientsOnly: boolean;
  };
}

interface UserState {
  isAuthenticated: boolean;
  token: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDietaryGoals: (goals: Partial<UserProfile['dietaryGoals']>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserProfile['preferences']>) => Promise<void>;
  addAllergy: (allergy: string) => Promise<void>;
  removeAllergy: (allergy: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      profile: null,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, you'd make an API call here
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();
          set({ 
            isAuthenticated: true, 
            token: data.token, 
            profile: data.profile,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
          });
        }
      },
      
      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, you'd make an API call here
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
          }

          const data = await response.json();
          set({ 
            isAuthenticated: true, 
            token: data.token, 
            profile: data.profile,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Signup failed' 
          });
        }
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          token: null, 
          profile: null 
        });
      },
      
      updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;
        
        set({ isLoading: true, error: null });
        try {
          // In a real app, you'd make an API call here
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Update failed');
          }

          const updatedProfile = await response.json();
          set({ 
            profile: updatedProfile,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Profile update failed' 
          });
        }
      },
      
      updateDietaryGoals: async (goals) => {
        const { profile } = get();
        if (!profile) return;
        
        const updatedGoals = { ...profile.dietaryGoals, ...goals };
        return get().updateProfile({ dietaryGoals: updatedGoals });
      },
      
      updatePreferences: async (prefs) => {
        const { profile } = get();
        if (!profile) return;
        
        const updatedPrefs = { ...profile.preferences, ...prefs };
        return get().updateProfile({ preferences: updatedPrefs });
      },
      
      addAllergy: async (allergy) => {
        const { profile } = get();
        if (!profile) return;
        
        if (!profile.allergies.includes(allergy)) {
          const updatedAllergies = [...profile.allergies, allergy];
          return get().updateProfile({ allergies: updatedAllergies });
        }
      },
      
      removeAllergy: async (allergy) => {
        const { profile } = get();
        if (!profile) return;
        
        const updatedAllergies = profile.allergies.filter(a => a !== allergy);
        return get().updateProfile({ allergies: updatedAllergies });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        profile: state.profile,
      }),
    }
  )
); 