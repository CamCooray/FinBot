
import React from 'react';
import { DollarSign } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#0D47A1] p-4 text-white flex items-center justify-center rounded-t-xl border-b border-finance-darkBorder">
      <div className="flex items-center space-x-2 font-medium">
        <DollarSign className="h-6 w-6" />
        <h1 className="text-xl">FinanceChat</h1>
      </div>
    </header>
  );
};

export default Header;
