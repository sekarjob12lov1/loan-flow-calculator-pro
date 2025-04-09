
import React from 'react';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  return (
    <header className="bg-finance-primary dark:bg-finance-dark text-white p-4 shadow-md transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loan Flow Calculator Pro</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Calculate EMIs, Prepayments & Part-payments
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
