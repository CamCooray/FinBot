
import React from 'react';
import { quickActions } from '../data/chatData';

interface QuickActionButtonsProps {
  onActionClick: (actionId: string) => void;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ onActionClick }) => {
  return (
    <div className="py-3">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Topics:</h3>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            className="quick-action-button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionButtons;
