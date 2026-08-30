import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub environment variables so supabase.js initialization doesn't throw
vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-supabase-url.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');

// Mock @supabase/supabase-js so it never runs actual queries
vi.mock('@supabase/supabase-js', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    }
  };
  return {
    createClient: vi.fn().mockReturnValue(mockClient),
  };
});
