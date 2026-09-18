import React from 'react';
import { DisclaimerBanner } from '../common/DisclaimerBanner.jsx';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';

export const AppLayout = ({ children, activePage, setActivePage }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <DisclaimerBanner />
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer setActivePage={setActivePage} />
    </div>
  );
};
