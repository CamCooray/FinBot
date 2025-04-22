from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage
from langchain.agents import AgentExecutor, create_tool_calling_agent

# Load environment variables
load_dotenv("environmentVars.env")

# declare flask app
app = Flask(__name__)


CORS(app,
     origins=["https://savvy-start-finance-chat-gs1i.vercel.app",
              "https://coorayfinbot.vercel.app",
              "savvy-start-finance-chat-gs1i-camcoorays-projects.vercel.app",
              "savvy-start-finance-chat-gs1i-git-main-camcoorays-projects.vercel.app"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type"],
     supports_credentials=True,
     always_send=True)








# Initialize the LLM
llm = ChatOpenAI(
    model_name="gpt-4o-mini",
    temperature=0.5
)

# Alpha Vantage Stock Price Tool
def get_alpha_vantage_stock(ticker_symbol):
    "Get current stock data for the specified ticker symbol using Alpha Vantage."
    api_key = os.getenv("ALPHA_API_KEY")
    if not api_key:
        return "Error: Alpha Vantage API key not found in environment variables."
    
    ticker = ticker_symbol.strip().upper()
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        print(data)
        
        if "Global Quote" in data and data["Global Quote"]:
            quote = data["Global Quote"]
            result = {
                "symbol": quote.get("01. symbol", "N/A"),
                "price": quote.get("05. price", "N/A"),
                "change": quote.get("09. change", "N/A"),
                "change_percent": quote.get("10. change percent", "N/A"),
                "volume": quote.get("06. volume", "N/A"),
                "latest_trading_day": quote.get("07. latest trading day", "N/A")
            }
            return f"Stock data for {ticker}: Price: ${result['price']}, Change: {result['change']} ({result['change_percent']}), Volume: {result['volume']}, Last Updated: {result['latest_trading_day']}"
        elif "Note" in data:
            return f"API limit reached: {data['Note']}"
        else:
            return f"Could not find stock data for {ticker}. Please verify the ticker symbol."
    except Exception as e:
        return f"Error retrieving stock data: {str(e)}"

# Stock News Tool
def get_market_news_sentiment(user_input: str = "market"):
    """Extract a keyword from the user input and fetch market news sentiment."""
    topic = extract_news_topic_from_message(user_input)
    api_key = os.getenv("NEWS_API_KEY")
    url = f"https://newsapi.org/v2/everything?q={topic}&language=en&sortBy=publishedAt&pageSize=5&apiKey={api_key}"

    try:
        response = requests.get(url)
        articles = response.json().get("articles", [])
        if not articles:
            return f"No news articles found for '{topic}'."

        summaries = []
        for article in articles:
            title = article["title"]
            desc = article.get("description", "")
            content = f"{title}. {desc}"
            sentiment = "Neutral"
            if any(word in content.lower() for word in ["fall", "drop", "bear", "recession", "plunge", "crash"]):
                sentiment = "Negative"
            elif any(word in content.lower() for word in ["rise", "gain", "bull", "record", "rally", "boom"]):
                sentiment = "Positive"

            summaries.append(f"t{title} ({sentiment})")

        return f"Topic extracted: **{topic}**\n\n" + "\n".join(summaries)

    except Exception as e:
        return f"Error retrieving news: {str(e)}"
    
#Helper method to extract relvant summary message from user query
def extract_news_topic_from_message(user_message: str) -> str:
    """Use LLM to extract a clean query keyword from the user's message."""
    extraction_prompt = f"""
You are a financial assistant. Extract the most relevant market-related keyword or topic from the user's question below, in 1-3 words, suitable for searching financial news headlines. Be specific.

User: "{user_message}"
Topic:
"""
    try:
        response = llm.invoke([HumanMessage(content=extraction_prompt)])
        return response.content.strip().replace('"', '')
    except Exception as e:
        return "market"


    
# Create tools list
tools = [
    Tool(
        name="StockPrice",
        func=get_alpha_vantage_stock,
        description="Get the current stock price and information for a company using its ticker symbol (e.g., AAPL for Apple, MSFT for Microsoft, AMZN for Amazon)"
    ),
    Tool(
        name="MarketNewsSentiment",
        func=get_market_news_sentiment,
        description="Fetch recent financial news headlines and analyze sentiment."
)


        
]

# Dictionary to store conversation sessions
sessions = {}

def create_finbot_agent(session_id: str):
    """Create a new FinBot agent with tool-calling capability"""
    # System message for the agent
    system_message = """You are FinBot, a helpful financial assistant designed for on providing education, particularly to new and younger investors. Your job is to provide quick, accurate, and easy-to-understand investment insights. Unlike basic chatbots,
    you have access to tools that provide real-time market data, ensuring users receive up-to-date and relevant financial information.

### **How to Respond:**
1. **Stock & Market Data:**
   - If the user asks about a stock, use the StockPrice tool to retrieve real-time data.
   - Provide a brief but **contextualized** summary of the stock's performance.
   - Include price, daily percentage change, and trading volume if available.
   - Identify **bullish** or **bearish** trends based on price movement.
   - Mention if the stock is trading at an **unusually high/low volume**.

2. **General Market Conditions:**
   - When asked about "the market" in general, summarize SPY (S&P 500 ETF) performance.
   - If SPY is down significantly, mention possible bearish sentiment.
   - If SPY is up, mention possible bullish sentiment.
   
3. **Market News Sentiment:**
    - When the user asks about the market's mood or news, use the MarketNewsSentiment tool.
    - Highlight if sentiment is generally positive, negative, or mixed.
    - Share a few headlines as context.

4. **Important Constraints:**
   - Do **not** provide investment advice or predict future prices.
   - Do **not** speculate on market movements beyond current factual data.
   - If API data is unavailable, **politely inform the user** and suggest checking financial news sources.

### **Response Formatting Guidelines:**
- Keep responses **clear, concise, and professional**.
- Use **plain language** (avoid excessive financial jargon).
- Offer **actionable insights** where relevant (e.g., "If you’re looking for sector trends, I can provide more details").
- For long-term trends, **recommend checking historical data sources**.

### **Example Responses:**
**User:** "How is the market today?"  
**FinBot:** "The S&P 500 ETF (SPY) is trading at $585.05, down 1.6% today. This suggests a bearish trend, with a trading volume of 70 million shares. Let me know if you need insights on specific sectors."

**User:** "How is the market last week?"  
**FinBot:** "The S&P 500 ETF (SPY) closed at $585.05, down 5.2%. This suggests a bearish trend, with a trading volume of 70 million shares. Let me know if you need insights on specific sectors."

**User:** "What's happening with AAPL?"  
**FinBot:** "Apple (AAPL) is at $172.45, up 2.3% today. This increase follows a strong earnings report. Trading volume is slightly above average. Would you like more details on technical indicators?"
"""
    
    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # Create a tool-calling agent 
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    # Wrap the agent in an executor (handles tool execution)
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True
    )
    
    return agent_executor


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    try:
        data = request.get_json()
        print(data) # Printing the user message for debugging
        user_input = data.get("message")
        session_id = data.get("session_id", "default")

        if not user_input:
            return jsonify({"error": "No input provided"}), 400
            
        # Get or create session
        if session_id not in sessions:
            # Create a new agent for this session
            sessions[session_id] = {
                "agent": create_finbot_agent(session_id),
                "chat_history": []
            }
        
        # Get current chat history
        chat_history = sessions[session_id]["chat_history"]
        
        # Invoke the agent with chat history
        response = sessions[session_id]["agent"].invoke({
            "input": user_input,
            "chat_history": chat_history
        })
        
        # Get the response text
        response_text = response.get("output", "I couldn't generate a response. Please try again.")
        
        # Update chat history
        sessions[session_id]["chat_history"].append(HumanMessage(content=user_input))
        sessions[session_id]["chat_history"].append(AIMessage(content=response_text))
        
        return jsonify({"response": response_text})

    except Exception as e:
        print(f"Backend error: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)