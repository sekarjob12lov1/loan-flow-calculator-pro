
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-4 mt-8 border-t border-gray-200">
      <div className="container mx-auto text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Loan Flow Calculator Pro. All rights reserved.</p>
        <p className="mt-1">Helping you make informed financial decisions.</p>
      </div>
    </footer>
  );
};

export default Footer;
