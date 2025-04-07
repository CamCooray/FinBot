
import React from 'react';

interface Choice {
  id: string;
  text: string;
}

interface RecommendedChoicesProps {
  choices: Choice[];
  onSelectChoice: (choice: string) => void;
  showChoices: boolean;
}

const RecommendedChoices: React.FC<RecommendedChoicesProps> = ({ 
  choices, 
  onSelectChoice,
  showChoices
}) => {
  if (!choices || choices.length === 0 || !showChoices) return null;
  
  return (
    <div className="mt-3 mb-2 flex flex-wrap gap-2 animate-fade-in">
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onSelectChoice(choice.text)}
          className="px-3 py-2 text-sm text-gray-200 bg-[#1E2736] hover:bg-[#283244] rounded-full 
                    transition-colors border border-gray-700 flex items-center"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
};

export default RecommendedChoices;
