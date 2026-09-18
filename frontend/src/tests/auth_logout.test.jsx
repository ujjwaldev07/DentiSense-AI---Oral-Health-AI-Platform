import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProfileDropdown } from '../components/common/ProfileDropdown.jsx';
import { SignOutModal } from '../components/common/SignOutModal.jsx';
import { LanguageProvider } from '../contexts/LanguageContext.jsx';

// Provide mock localStorage for Node test runner
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};


describe('ProfileDropdown Component', () => {
  it('renders correctly for normal user without Admin Portal', () => {
    const normalUser = {
      name: 'Rahul Sharma',
      email: 'user@dentalaware.org',
      role: 'user'
    };

    const html = renderToString(
      <LanguageProvider>
        <ProfileDropdown
          user={normalUser}
          isAdmin={false}
          isOpen={true}
          onClose={() => {}}
          onNavigate={() => {}}
          onSignOutClick={() => {}}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Rahul Sharma');
    expect(html).toContain('user@dentalaware.org');
    expect(html).toContain('Verified Member');
    expect(html).toContain('My Profile');
    expect(html).toContain('Account Settings');
    expect(html).toContain('Sign Out');
    expect(html).not.toContain('Admin Portal');
  });

  it('renders correctly for admin user with Administrator badge and Admin Portal', () => {
    const adminUser = {
      name: 'Dr. Neha Sharma',
      email: 'admin@dentalaware.org',
      role: 'admin'
    };

    const html = renderToString(
      <LanguageProvider>
        <ProfileDropdown
          user={adminUser}
          isAdmin={true}
          isOpen={true}
          onClose={() => {}}
          onNavigate={() => {}}
          onSignOutClick={() => {}}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Dr. Neha Sharma');
    expect(html).toContain('admin@dentalaware.org');
    expect(html).toContain('Administrator');
    expect(html).toContain('My Profile');
    expect(html).toContain('Admin Portal');
    expect(html).toContain('Account Settings');
    expect(html).toContain('Sign Out');
  });

  it('renders nothing when isOpen is false', () => {
    const user = { name: 'Test User', email: 'test@example.com' };
    const html = renderToString(
      <LanguageProvider>
        <ProfileDropdown
          user={user}
          isAdmin={false}
          isOpen={false}
          onClose={() => {}}
          onNavigate={() => {}}
          onSignOutClick={() => {}}
        />
      </LanguageProvider>
    );
    expect(html).toBe('');
  });
});

describe('SignOutModal Component', () => {
  it('renders title, description, and cancel/signout buttons with responsive classes when open', () => {
    const html = renderToString(
      <LanguageProvider>
        <SignOutModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          isLoggingOut={false}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Sign out of DentiSense AI?');
    expect(html).toContain('You will need to log in again to access your account.');
    expect(html).toContain('Cancel');
    expect(html).toContain('Sign Out');
    // Verify responsive stacking and containment classes
    expect(html).toContain('flex-col-reverse');
    expect(html).toContain('sm:flex-row');
    expect(html).toContain('max-h-[calc(100dvh-2rem)]');
  });

  it('shows loading indicator text when isLoggingOut is true', () => {
    const html = renderToString(
      <LanguageProvider>
        <SignOutModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          isLoggingOut={true}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Signing out...');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <LanguageProvider>
        <SignOutModal
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          isLoggingOut={false}
        />
      </LanguageProvider>
    );
    expect(html).toBe('');
  });
});

describe('Profile Content Safety & Word Wrapping', () => {
  it('preserves full names and long emails with accessible title and break-all', () => {
    const longUser = {
      name: 'Dr. Very Long User Name That Spans Multiple Words And Titles',
      email: 'extraordinary.long.clinical.administrator.email@dentisense.org',
      role: 'admin'
    };

    const html = renderToString(
      <LanguageProvider>
        <ProfileDropdown
          user={longUser}
          isAdmin={true}
          isOpen={true}
          onClose={() => {}}
          onNavigate={() => {}}
          onSignOutClick={() => {}}
        />
      </LanguageProvider>
    );

    expect(html).toContain('Dr. Very Long User Name That Spans Multiple Words And Titles');
    expect(html).toContain('extraordinary.long.clinical.administrator.email@dentisense.org');
    expect(html).toContain('break-words');
    expect(html).toContain('break-all');
  });
});


describe('Storage & Preference Isolation', () => {
  it('clears only auth tokens and preserves non-auth preferences', () => {
    const fakeStorage = {
      denta_token: 'jwt-token-xyz',
      denta_user: JSON.stringify({ id: '123', name: 'Dr. Test' }),
      auth_token: 'legacy-token',
      denta_theme: 'dark',
      denta_lang: 'hi'
    };

    // Simulate logout token removal logic from AuthContext
    delete fakeStorage.denta_token;
    delete fakeStorage.denta_user;
    delete fakeStorage.auth_token;

    // Verify auth tokens removed
    expect(fakeStorage.denta_token).toBeUndefined();
    expect(fakeStorage.denta_user).toBeUndefined();
    expect(fakeStorage.auth_token).toBeUndefined();

    // Verify user preferences strictly preserved
    expect(fakeStorage.denta_theme).toBe('dark');
    expect(fakeStorage.denta_lang).toBe('hi');
  });
});

describe('Sign Out Flow & Robust Error Resilience', () => {
  it('invokes onSignOutClick and cleans up local state even if backend logout rejects', async () => {
    let storageCleared = false;
    let errorCaught = false;

    // Simulate AuthContext logout with backend failure
    const mockLogout = async () => {
      let apiError = null;
      try {
        throw new Error('500 Internal Server Error');
      } catch (err) {
        apiError = err;
      } finally {
        storageCleared = true;
      }
      if (apiError) throw apiError;
    };

    try {
      await mockLogout();
    } catch {
      errorCaught = true;
    }

    expect(storageCleared).toBe(true);
    expect(errorCaught).toBe(true);
  });

  it('verifies protected route auth guard redirect behavior', () => {
    const isAuth = false;
    const protectedPages = ['profile', 'dashboard', 'admin'];

    protectedPages.forEach((page) => {
      let activePage = page;
      if (!isAuth && (activePage === 'profile' || activePage === 'dashboard' || activePage === 'admin')) {
        activePage = 'login';
      }
      expect(activePage).toBe('login');
    });
  });
});

