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
} from '@/lib/types';
import { ApiError } from '@/lib/types';

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail || error.message || 'Request failed';
    throw new ApiError(detail, error.response?.status ?? 500);
  }
);

const unwrap = <T>(p: Promise<{ data: T }>): Promise<T> => p.then((r) => r.data);

// ------ AUTH API ------
export const authApi = {
  login: (loginData: LoginData): Promise<UserPublic> => {
    const formData = new FormData();
    formData.append('username', loginData.username);
    formData.append('password', loginData.password);

    return unwrap(
      api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
  },

  logout: () => unwrap(api.post('/auth/logout')),

  changePassword: (
    oldPassword: string,
    newPassword: string,
    encryptedPrivateKey?: string
  ): Promise<void> =>
    unwrap(
      api.put('/users/me/password', {
        old_password: oldPassword,
        new_password: newPassword,
        encrypted_private_key: encryptedPrivateKey,
      })
    ),

  changeKeys: (publicKey: string, encryptedPrivateKey: string): Promise<void> =>
    unwrap(
      api.put('/users/me/keys', {
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
      })
    ),
};

// ------ USER API ------
export const userApi = {
  register: (userData: UserCreate): Promise<UserPublic> =>
    unwrap(api.post('/users', userData)),

  getUserById: (id: number): Promise<UserPublic> => unwrap(api.get(`/users/${id}`)),

  getCurrentUser: (): Promise<UserPublic> => unwrap(api.get('/users/me')),
};

// ------ TEAMS API ------
export const teamsApi = {
  getMyTeams: (): Promise<TeamDetailed[]> => unwrap(api.get('/teams')),

  applyToTeam: (teamCode: string): Promise<{ message?: string; error?: string }> =>
    unwrap(api.post('/teams/applications', { team_code: teamCode })),

  getTeamApplications: (teamId: number): Promise<TeamApplicationResponse[]> =>
    unwrap(api.get(`/teams/${teamId}/applications`)),

  respondToApplication: (
    teamId: number,
    userId: number,
    action: TeamApplicationAction
  ): Promise<{ message?: string; error?: string }> =>
    unwrap(api.post(`/teams/${teamId}/applications/${userId}/respond`, action)),

  getMyApplications: (): Promise<PendingApplication[]> =>
    unwrap(api.get('/teams/applications/my')),

  createTeam: (team: TeamCreate): Promise<TeamDetailed> =>
    unwrap(api.post('/teams', team)),

  kickUserFromTeam: (teamId: number, userId: number): Promise<void> =>
    unwrap(api.delete(`/teams/${teamId}/members/${userId}`)),

  quitTeam: (teamId: number): Promise<void> =>
    unwrap(api.delete(`/teams/${teamId}/membership`)),
};

// ------ CREDENTIALS API ------
export const credentialsApi = {
  getMyCredentials: (): Promise<CredentialPublic[]> => unwrap(api.get('/credentials')),

  getCredentialById: (id: number): Promise<CredentialPublic> =>
    unwrap(api.get(`/credentials/${id}`)),

  getCredentialByGroup: (group: string): Promise<CredentialPublic[]> =>
    unwrap(api.get(`/credentials/group/${group}`)),

  createCredential: (credentialData: CredentialCreate): Promise<CredentialPublic> =>
    unwrap(api.post('/credentials', credentialData)),

  createCredentialBatch: (
    credentials: CredentialCreate[]
  ): Promise<CredentialPublic[]> => unwrap(api.post('/credentials/batch', credentials)),

  updateCredentialOne: (
    id: number,
    credentialData: CredentialUpdate
  ): Promise<CredentialPublic> => unwrap(api.put(`/credentials/${id}`, credentialData)),

  updateCredentialGroup: (
    group: string,
    credentialData: CredentialUpdate
  ): Promise<CredentialPublic> =>
    unwrap(api.put(`/credentials/group/${group}`, credentialData)),

  updateCredentialBatch: (
    credentials: CredentialUpdate[]
  ): Promise<CredentialPublic[]> => unwrap(api.put('/credentials/batch', credentials)),

  deleteCredentialOne: (id: number): Promise<void> =>
    unwrap(api.delete(`/credentials/${id}`)),

  deleteCredentialGroup: (group: string): Promise<void> =>
    unwrap(api.delete(`/credentials/group/${group}`)),
};
