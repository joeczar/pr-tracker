export interface TestUser {
  id: number;
  github_id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export const testUsers: Record<string, TestUser> = {
  authenticatedUser: {
    id: 1,
    github_id: 12345,
    login: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
  },
  
  premiumUser: {
    id: 2,
    github_id: 67890,
    login: 'premiumuser',
    name: 'Premium User',
    email: 'premium@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/67890?v=4'
  },

  organizationUser: {
    id: 3,
    github_id: 11111,
    login: 'orguser',
    name: 'Organization User',
    email: 'org@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/11111?v=4'
  }
};

export interface TestRepository {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  user_id: number;
}

export const testRepositories: TestRepository[] = [
  {
    id: 1,
    github_id: 123456789,
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    owner: 'testuser',
    private: false,
    user_id: 1
  },
  {
    id: 2,
    github_id: 987654321,
    name: 'private-repo',
    full_name: 'testuser/private-repo',
    owner: 'testuser',
    private: true,
    user_id: 1
  }
];

export interface MockOAuthResponse {
  success: boolean;
  error?: string;
  user?: TestUser;
  redirect_url?: string;
}

export const oAuthResponses: Record<string, MockOAuthResponse> = {
  success: {
    success: true,
    user: testUsers.authenticatedUser,
    redirect_url: '/dashboard'
  },
  
  userDenied: {
    success: false,
    error: 'access_denied',
    redirect_url: '/login?error=access_denied'
  },
  
  invalidState: {
    success: false,
    error: 'invalid_state',
    redirect_url: '/login?error=invalid_state'
  },
  
  serverError: {
    success: false,
    error: 'server_error',
    redirect_url: '/login?error=server_error'
  }
};