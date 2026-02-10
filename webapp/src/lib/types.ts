// ------ AUTH TYPES ------
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

// ------ USER TYPES ------
export interface UserBase {
  username: string;
}

export interface User extends UserBase {
  id: number;
}

export interface UserCreate extends UserBase {
  password: string;
  public_key: string;
  encrypted_private_key: string;
}

export interface UserPublic extends UserBase {
  id: number;
  public_key?: string;
  encrypted_private_key?: string;
  member_teams: TeamPublic[];
  admin_teams: TeamPublic[];
}

// ------ TEAM TYPES ------
export interface TeamBase {
  name: string;
}

export interface Team extends TeamBase {
  id: number;
  code: string;
}

export interface TeamPublic extends TeamBase {
  id?: number;
  code: string;
}

export interface TeamDetailed extends TeamBase {
  id: number;
  code: string;
  members: Array<{ id?: number; username: string }>;
  admins: Array<{ id?: number; username: string }>;
  awaiting?: Array<{ id?: number; username: string }>;
}

export interface TeamCreate extends TeamBase {
  admin_id: number;
}

export interface TeamApplication {
  team_code: string;
}

export interface TeamApplicationResponse {
  application_id: string;
  user_id: number;
  username: string;
  team_id: number;
  team_name: string;
}

export interface TeamApplicationAction {
  action: 'accept' | 'decline';
  role?: 'member' | 'admin';
}

export interface PendingApplication {
  team_id: number;
  team_name: string;
  team_code: string;
  application_date: string;
}

export interface UserRemove {
  user_id: number;
  team_id: number;
}

// ------ CREDENTIAL TYPES ------
export interface CredentialBase {
  login?: string;
  record_name?: string;
  url?: string;
  edited?: boolean;
  group?: string;
  team_id?: number;
}

export interface Credential extends CredentialBase {
  id: number;
  encrypted_password: string;
  user_id: number;
  team_id?: number;
}

export interface CredentialPublic extends CredentialBase {
  id: number;
  password: string;
  team_id?: number;
  user_id?: number;
}

export interface CredentialCreate extends CredentialBase {
  password: string;
  team_id?: number;
  user_id?: number;
}

export interface CredentialUpdate extends CredentialBase {
  id?: number;
  password: string | null;
  user_id?: number;
}

// ------ API ERROR TYPES ------
export interface ApiErrorResponse {
  detail: string;
  status?: number;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number = 500, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail || message;
    this.name = 'ApiError';
  }
}
