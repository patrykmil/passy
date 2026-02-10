import axios, { type AxiosInstance } from 'axios';
import type {
  UserCreate,
  UserPublic,
  CredentialPublic,
  CredentialCreate,
  CredentialUpdate,
  TeamDetailed,
  TeamApplicationResponse,
  TeamApplicationAction,
  PendingApplication,
  LoginData,
  TeamCreate,
  UserRemove,
} from '@/lib/types';
import { ApiError } from '@/lib/types';

// ------ API CLIENT SETUP ------
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

// ------ ERROR HANDLING UTILITY ------
const handleApiError = (error: any, defaultMessage: string): never => {
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail || defaultMessage;
    throw new ApiError(detail, status, detail);
  }
  throw new ApiError(defaultMessage);
};

// ------ AUTH API ------
export const authApi = {
  login: async (loginData: LoginData): Promise<UserPublic> => {
    try {
      const formData = new FormData();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Login failed');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      return handleApiError(error, 'Logout failed');
    }
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string,
    encryptedPrivateKey?: string
  ): Promise<void> => {
    try {
      const data: Record<string, string | undefined> = {
        old_password: oldPassword,
        new_password: newPassword,
      };

      if (encryptedPrivateKey) {
        data.encrypted_private_key = encryptedPrivateKey;
      }

      await api.put('/users/me/password', data);
    } catch (error) {
      return handleApiError(error, 'Change password failed');
    }
  },

  changeKeys: async (publicKey: string, encryptedPrivateKey: string): Promise<void> => {
    try {
      const data: Record<string, string> = {
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
      };

      await api.put('/users/me/keys', data);
    } catch (error) {
      return handleApiError(error, 'Change keys failed');
    }
  },
};

// ------ USER API ------
export const userApi = {
  register: async (userData: UserCreate): Promise<UserPublic> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Registration failed');
    }
  },

  getUserById: async (id: number): Promise<UserPublic> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch user');
    }
  },

  getCurrentUser: async (): Promise<UserPublic> => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch current user');
    }
  },
};

// ------ TEAMS API ------
export const teamsApi = {
  getMyTeams: async (): Promise<TeamDetailed[]> => {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch my teams');
    }
  },

  applyToTeam: async (
    teamCode: string
  ): Promise<{ message?: string; error?: string }> => {
    try {
      const response = await api.post('/teams/applications', { team_code: teamCode });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to apply to team');
    }
  },

  getTeamApplications: async (teamId: number): Promise<TeamApplicationResponse[]> => {
    try {
      const response = await api.get(`/teams/${teamId}/applications`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch team applications');
    }
  },

  respondToApplication: async (
    teamId: number,
    userId: number,
    action: TeamApplicationAction
  ): Promise<{ message?: string; error?: string }> => {
    try {
      const response = await api.post(
        `/teams/${teamId}/applications/${userId}/respond`,
        action
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to respond to application');
    }
  },

  getMyApplications: async (): Promise<PendingApplication[]> => {
    try {
      const response = await api.get('/teams/applications/my');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch my applications');
    }
  },

  createTeam: async (team: TeamCreate): Promise<TeamDetailed> => {
    try {
      const response = await api.post('/teams', team);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to create team');
    }
  },

  kickUserFromTeam: async (userRemove: UserRemove): Promise<TeamDetailed> => {
    try {
      const response = await api.delete(
        `/teams/${userRemove.team_id}/members/${userRemove.user_id}`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to remove user from team');
    }
  },

  quitTeam: async (teamId: number): Promise<void> => {
    try {
      await api.delete(`/teams/${teamId}/membership`);
    } catch (error) {
      return handleApiError(error, 'Failed to quit team');
    }
  },
};

// ------ CREDENTIALS API ------
export const credentialsApi = {
  getMyCredentials: async (): Promise<CredentialPublic[]> => {
    try {
      const response = await api.get('/credentials');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch credentials');
    }
  },

  getCredentialById: async (id: number): Promise<CredentialPublic> => {
    try {
      const response = await api.get(`/credentials/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch credential');
    }
  },

  getCredentialByGroup: async (group: string): Promise<Array<CredentialPublic>> => {
    try {
      const response = await api.get(`/credentials/group/${group}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch credential');
    }
  },

  createCredential: async (
    credentialData: CredentialCreate
  ): Promise<CredentialPublic> => {
    try {
      const response = await api.post('/credentials', credentialData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to create credential');
    }
  },

  updateCredentialOne: async (
    id: number,
    credentialData: CredentialUpdate
  ): Promise<CredentialPublic> => {
    try {
      const response = await api.put(`/credentials/${id}`, credentialData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to update credential');
    }
  },

  updateCredentialGroup: async (
    group: string,
    credentialData: CredentialUpdate
  ): Promise<CredentialPublic> => {
    try {
      const response = await api.put(`/credentials/group/${group}`, credentialData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to update credential');
    }
  },

  updateCredentialBatch: async (
    credentials: CredentialUpdate[]
  ): Promise<CredentialPublic[]> => {
    try {
      const response = await api.put(`/credentials/batch`, credentials);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to update credential');
    }
  },

  deleteCredentialOne: async (id: number): Promise<void> => {
    try {
      await api.delete(`/credentials/${id}`);
    } catch (error) {
      return handleApiError(error, 'Failed to delete credential');
    }
  },

  deleteCredentialGroup: async (group: string): Promise<void> => {
    try {
      await api.delete(`/credentials/group/${group}`);
    } catch (error) {
      return handleApiError(error, 'Failed to delete credential');
    }
  },
};
