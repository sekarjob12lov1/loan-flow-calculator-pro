
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useAppVersion } from '@/App';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { currentVersionInfo } = useAppVersion();
  
  return (
    <header className="bg-finance-primary dark:bg-finance-dark text-white p-4 shadow-md transition-colors duration-300">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Loan Flow Calculator Pro</h1>
          <Badge variant="outline" className="text-white border-white/30">
            {currentVersionInfo.version}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm hidden md:block">
            Calculate EMIs, Prepayments & Part-payments
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
