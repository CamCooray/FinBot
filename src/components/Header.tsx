
import React from 'react';
import { DollarSign } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#1A1F2C] p-4 text-white flex items-center justify-center rounded-t-xl border-b border-[#333333]">
      <div className="flex items-center space-x-3 font-medium">
        <div className="bg-finance-primary p-1.5 rounded-full">
          <DollarSign className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">FinanceChat</h1>
      </div>
    </header>
  );
};

export default Header;
