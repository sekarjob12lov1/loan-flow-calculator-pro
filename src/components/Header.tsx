
import React from 'react';

const Header = () => {
  return (
    <header className="bg-finance-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loan Flow Calculator Pro</h1>
        <div className="text-sm">
          Calculate EMIs, Prepayments & Part-payments
        </div>
      </div>
    </header>
  );
};

export default Header;
