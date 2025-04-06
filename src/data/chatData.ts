
export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  question: string;
}

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hello! I\'m your financial education assistant, here to help you learn about investing. What would you like to know about today?',
    timestamp: new Date(),
  },
];

export const quickActions: QuickAction[] = [
  {
    id: 'stocks',
    label: 'Stock Basics',
    question: 'What are stocks and how do they work?',
  },
  {
    id: 'etfs',
    label: 'ETFs',
    question: 'What are ETFs and why are they recommended for beginners?',
  },
  {
    id: 'risk',
    label: 'Risk Management',
    question: 'How do I manage risk in my investment portfolio?',
  },
  {
    id: 'retirement',
    label: 'Retirement Planning',
    question: 'How should I start planning for retirement?',
  },
  {
    id: 'diversification',
    label: 'Diversification',
    question: 'What is diversification and why is it important?',
  },
];

export const botResponses: Record<string, string> = {
  'stocks': 'Stocks represent ownership shares in a company. When you buy a stock, you're purchasing a small piece of that company. As a shareholder, you may benefit from the company's growth through stock price appreciation and possibly dividends.\n\nStocks are bought and sold on exchanges like the NYSE or NASDAQ. Their prices fluctuate based on supply and demand, company performance, economic conditions, and investor sentiment.\n\nMany beginners start with blue-chip stocks (established companies) or index funds that track the broader market like the S&P 500.',
  
  'etfs': 'ETFs (Exchange-Traded Funds) are investment funds that trade on stock exchanges. They contain a collection of securities—like stocks, bonds, or commodities—and are designed to track the performance of a specific index or sector.\n\nETFs are recommended for beginners because they:\n• Provide instant diversification across many companies\n• Have lower expense ratios than many mutual funds\n• Trade like stocks throughout the day\n• Often require lower minimum investments than mutual funds\n• Come in various types to match different investment goals\n\nPopular beginner ETFs include those tracking total stock market indices, the S&P 500, or specific sectors you believe in.',
  
  'risk': 'Risk management is crucial for successful investing. Here are key strategies:\n\n1. Diversification: Spread investments across different asset classes (stocks, bonds, etc.), sectors, and geographic regions to reduce exposure to any single investment.\n\n2. Asset Allocation: Balance higher-risk investments with more stable ones based on your time horizon and risk tolerance.\n\n3. Dollar-Cost Averaging: Invest fixed amounts regularly rather than all at once to reduce the impact of market volatility.\n\n4. Emergency Fund: Maintain 3-6 months of expenses in cash before aggressive investing.\n\n5. Regular Rebalancing: Periodically adjust your portfolio back to target allocations.\n\n6. Long-Term Perspective: Focus on long-term goals rather than short-term market movements.',
  
  'retirement': 'Starting retirement planning involves several key steps:\n\n1. Employer Plans: Maximize contributions to employer-sponsored plans like 401(k)s, especially if your employer offers matching.\n\n2. IRAs: Consider opening a Traditional or Roth IRA for additional tax-advantaged savings.\n\n3. Set Clear Goals: Determine how much you'll need in retirement based on desired lifestyle and expected expenses.\n\n4. Start Early: Take advantage of compound interest by starting as early as possible.\n\n5. Increase Savings Rate: Aim to save 15% or more of your income for retirement.\n\n6. Appropriate Risk: Take on more risk when young (more stocks) and gradually become more conservative as you approach retirement.\n\n7. Regular Reviews: Reassess your retirement strategy annually or after major life events.',
  
  'diversification': 'Diversification is spreading your investments across various assets to reduce risk. It's based on the principle that different assets perform differently under various market conditions.\n\nImportance of diversification:\n• Reduces portfolio volatility and risk\n• Protects against significant losses from any single investment\n• Provides more consistent returns over time\n• Helps preserve capital during market downturns\n\nYou can diversify across:\n• Asset classes (stocks, bonds, real estate, etc.)\n• Sectors and industries\n• Geographic regions (domestic and international)\n• Company sizes (large, mid, small-cap)\n• Investment styles (growth, value)\n\nRemember: While diversification reduces risk, it doesn't eliminate it completely.',
  
  'hello': 'Hello! I\'m your financial education assistant. I can help you learn about investing basics, retirement planning, risk management, and more. What would you like to know about today?',
  
  'default': 'That\'s a great investment question! As a beginner investor, it\'s important to start with fundamentals and gradually build your knowledge. I\'d recommend exploring our quick access topics below, or you can ask me about specific investment concepts you\'re curious about.'
};
