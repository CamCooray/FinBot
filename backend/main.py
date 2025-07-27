from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import logging
import re
import html
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from typing import TypedDict, List, Optional
from langchain_core.messages import BaseMessage
from langchain.agents import AgentExecutor, create_tool_calling_agent

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('finbot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "environmentVars.env"))

# Validate all required API keys
def validate_api_keys():
    """Validate that all required API keys are present"""
    required_keys = {
        "OPENAI_API_KEY": "OpenAI API key for LLM functionality",
        "ALPHA_API_KEY": "Alpha Vantage API key for stock data", 
        "NEWS_API_KEY": "News API key for market news"
    }
    
    missing_keys = []
    for key, description in required_keys.items():
        if not os.getenv(key):
            missing_keys.append(f"{key} ({description})")
            logger.error(f"Missing {key}: {description}")
        else:
            logger.info(f"✓ {key} loaded successfully")
    
    if missing_keys:
        logger.warning(f"Missing API keys: {', '.join(missing_keys)}")
        logger.warning("Some features may be limited without these keys")
    
    return len(missing_keys) == 0

# Validate API keys on startup
validate_api_keys()

# declare flask app
app = Flask(__name__)

# Configure CORS securely based on environment
def configure_cors():
    """Configure CORS based on environment"""
    is_production = os.getenv("FLASK_ENV") == "production"
    
    if is_production:
        # Production: Only allow specific domains
        allowed_origins = [
            "https://finbot-k5bl.onrender.com",  # Your production frontend
            "https://your-production-domain.com"  # Add your actual production domain
        ]
    else:
        # Development: Allow local development servers
        allowed_origins = [
            "http://localhost:5173",
            "http://localhost:8081", 
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8081"
        ]
    
    CORS(app, origins=allowed_origins)
    logger.info(f"CORS configured for: {allowed_origins}")

configure_cors()


# Initialize the LLM with better error handling
try:
    llm = ChatOpenAI(
        model_name="gpt-4o-mini",
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.5,
        max_tokens=1000,
        timeout=30
    )
    logger.info("✓ LLM initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize LLM: {e}")
    raise

# Simple in-memory cache for API responses
api_cache = {}
CACHE_DURATION = 300  # 5 minutes in seconds

# Rate limiting
rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 30  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

def is_rate_limited(client_ip: str) -> bool:
    """Check if client IP is rate limited"""
    now = datetime.now().timestamp()
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip] 
        if now - timestamp < RATE_LIMIT_WINDOW
    ]
    
    # Check if over limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return True
    
    # Add current request
    rate_limit_store[client_ip].append(now)
    return False

def sanitize_input(user_input: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    if not user_input:
        return ""
    
    # Remove potentially harmful characters and HTML
    sanitized = html.escape(user_input.strip())
    
    # Remove excessive whitespace
    sanitized = re.sub(r'\s+', ' ', sanitized)
    
    # Limit length
    if len(sanitized) > 1000:
        sanitized = sanitized[:1000]
    
    return sanitized

def get_cached_response(cache_key: str) -> dict:
    """Get cached response if still valid"""
    if cache_key in api_cache:
        cached_data, timestamp = api_cache[cache_key]
        if datetime.now().timestamp() - timestamp < CACHE_DURATION:
            logger.info(f"Using cached response for {cache_key}")
            return cached_data
        else:
            # Remove expired cache entry
            del api_cache[cache_key]
    return None

def cache_response(cache_key: str, data: dict):
    """Cache the response with timestamp"""
    api_cache[cache_key] = (data, datetime.now().timestamp())
    logger.info(f"Cached response for {cache_key}")

# Enhanced Alpha Vantage Stock Price Tool
def get_alpha_vantage_stock(ticker_symbol: str) -> str:
    """Get current stock data for the specified ticker symbol using Alpha Vantage."""
    if not ticker_symbol or not ticker_symbol.strip():
        return "Error: Please provide a valid ticker symbol."
    
    api_key = os.getenv("ALPHA_API_KEY")
    if not api_key:
        logger.error("Alpha Vantage API key not found")
        return "Error: Stock data service is currently unavailable. Please try again later."
    
    ticker = ticker_symbol.strip().upper()
    cache_key = f"stock_{ticker}"
    
    # Check cache first
    cached_data = get_cached_response(cache_key)
    if cached_data:
        return format_stock_response(cached_data, ticker)
    
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={api_key}"
    
    try:
        logger.info(f"Fetching stock data for {ticker}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if "Global Quote" in data and data["Global Quote"]:
            # Cache the successful response
            cache_response(cache_key, data)
            return format_stock_response(data, ticker)
        elif "Note" in data:
            logger.warning(f"Alpha Vantage rate limit hit: {data['Note']}")
            return f"⚠️ API rate limit reached for stock data. Please try again in a minute."
        elif "Error Message" in data:
            logger.error(f"Alpha Vantage error: {data['Error Message']}")
            return f"❌ Invalid ticker symbol '{ticker}'. Please verify the symbol and try again."
        else:
            logger.warning(f"Unexpected response format for {ticker}: {data}")
            return f"⚠️ Could not find stock data for '{ticker}'. Please verify the ticker symbol."
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout fetching stock data for {ticker}")
        return "⏱️ Request timed out. Stock data service may be slow. Please try again."
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching stock data for {ticker}: {e}")
        return "🔌 Network error occurred. Please check your connection and try again."
    except Exception as e:
        logger.error(f"Unexpected error fetching stock data for {ticker}: {e}")
        return "❌ An unexpected error occurred while fetching stock data."

def format_stock_response(data: dict, ticker: str) -> str:
    """Format the stock response data into a readable string"""
    try:
        quote = data["Global Quote"]
        
        # Extract and format the data
        symbol = quote.get("01. symbol", ticker)
        price = float(quote.get("05. price", 0))
        change = float(quote.get("09. change", 0))
        change_percent = quote.get("10. change percent", "0%").replace("%", "")
        volume = int(quote.get("06. volume", 0))
        last_trading_day = quote.get("07. latest trading day", "N/A")
        
        # Format price and change
        price_formatted = f"${price:.2f}"
        change_formatted = f"${change:+.2f}"
        change_percent_formatted = f"({change_percent}%)"
        volume_formatted = f"{volume:,}"
        
        # Determine trend emoji
        trend_emoji = "📈" if change >= 0 else "📉"
        
        # Create response with clean formatting
        response = f"{trend_emoji} {symbol} Stock Information\n\n"
        response += f"💰 Current Price: {price_formatted}\n"
        response += f"📊 Today's Change: {change_formatted} {change_percent_formatted}\n"
        response += f"📈 Trading Volume: {volume_formatted} shares\n"
        response += f"📅 Last Updated: {last_trading_day}\n\n"
        
        # Add context based on performance
        if abs(change) > price * 0.05:  # More than 5% change
            response += f"⚠️ Significant movement alert! This represents a {abs(float(change_percent)):.1f}% change today."
        elif change > 0:
            response += "✅ Positive momentum - Stock is trending upward today."
        else:
            response += "📉 Downward movement - Stock is declining today."
            
        return response
        
    except (KeyError, ValueError, TypeError) as e:
        logger.error(f"Error formatting stock response for {ticker}: {e}")
        return f"✅ Found data for {ticker}, but there was an issue formatting the response. Please try again."

# Enhanced Stock News Tool
def get_market_news_sentiment(user_input: str = "market") -> str:
    """Extract a keyword from the user input and fetch market news sentiment."""
    topic = extract_news_topic_from_message(user_input)
    api_key = os.getenv("NEWS_API_KEY")
    
    if not api_key:
        logger.error("News API key not found")
        return "⚠️ News service is currently unavailable. Please try again later."
    
    cache_key = f"news_{topic.lower()}"
    
    # Check cache first
    cached_data = get_cached_response(cache_key)
    if cached_data:
        return format_news_response(cached_data, topic)
    
    url = f"https://newsapi.org/v2/everything?q={topic}&language=en&sortBy=publishedAt&pageSize=8&apiKey={api_key}"

    try:
        logger.info(f"Fetching news for topic: {topic}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "error":
            logger.error(f"News API error: {data.get('message', 'Unknown error')}")
            return f"⚠️ Error fetching news: {data.get('message', 'Unknown error')}"
        
        articles = data.get("articles", [])
        if not articles:
            return f"📰 No recent news articles found for '{topic}'. Try a different topic or check back later."

        # Cache successful response
        cache_response(cache_key, data)
        return format_news_response(data, topic)

    except requests.exceptions.Timeout:
        logger.error(f"Timeout fetching news for {topic}")
        return "⏱️ News request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching news for {topic}: {e}")
        return "🔌 Network error occurred while fetching news. Please try again."
    except Exception as e:
        logger.error(f"Unexpected error fetching news for {topic}: {e}")
        return "❌ An unexpected error occurred while fetching news."

def format_news_response(data: dict, topic: str) -> str:
    """Format news response with better sentiment analysis"""
    try:
        articles = data.get("articles", [])
        
        if not articles:
            return f"📰 No recent news found for '{topic}'."
        
        # Analyze sentiment more comprehensively
        positive_keywords = ["rise", "gain", "bull", "record", "rally", "boom", "surge", "climb", "up", "growth", "profit", "beat", "strong", "optimistic", "recovery"]
        negative_keywords = ["fall", "drop", "bear", "recession", "plunge", "crash", "decline", "down", "loss", "miss", "weak", "concern", "worry", "uncertainty", "volatility"]
        
        sentiment_scores = {"Positive": 0, "Negative": 0, "Neutral": 0}
        summaries = []
        
        for i, article in enumerate(articles[:5]):  # Limit to 5 articles for readability
            title = article.get("title", "")
            description = article.get("description", "")
            source = article.get("source", {}).get("name", "Unknown")
            published_at = article.get("publishedAt", "")
            
            if not title:
                continue
                
            content = f"{title} {description}".lower()
            
            # Calculate sentiment score
            positive_count = sum(1 for word in positive_keywords if word in content)
            negative_count = sum(1 for word in negative_keywords if word in content)
            
            if positive_count > negative_count:
                sentiment = "Positive"
                sentiment_emoji = "📈"
            elif negative_count > positive_count:
                sentiment = "Negative" 
                sentiment_emoji = "📉"
            else:
                sentiment = "Neutral"
                sentiment_emoji = "📊"
            
            sentiment_scores[sentiment] += 1
            
            # Format date
            try:
                date_obj = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                formatted_date = date_obj.strftime("%m/%d")
            except:
                formatted_date = "Recent"
            
            # Clean and shorten title if too long
            clean_title = title[:80] + "..." if len(title) > 80 else title
            summaries.append(f"{sentiment_emoji} {clean_title}\n    📰 {source} • {formatted_date}")
        
        # Calculate overall sentiment
        total_articles = sum(sentiment_scores.values())
        if total_articles == 0:
            overall_sentiment = "No sentiment data available"
            sentiment_emoji = "📊"
        else:
            dominant_sentiment = max(sentiment_scores, key=sentiment_scores.get)
            sentiment_percentage = (sentiment_scores[dominant_sentiment] / total_articles) * 100
            
            if sentiment_percentage >= 60:
                overall_sentiment = f"{dominant_sentiment} ({sentiment_percentage:.0f}%)"
            else:
                overall_sentiment = "Mixed sentiment"
            
            sentiment_emoji = "📈" if dominant_sentiment == "Positive" else "📉" if dominant_sentiment == "Negative" else "📊"
        
        # Build response with cleaner formatting
        response = f"📰 Market News for '{topic.title()}'\n\n"
        response += f"{sentiment_emoji} Overall Sentiment: {overall_sentiment}\n"
        response += f"📊 Breakdown: {sentiment_scores['Positive']} Positive • {sentiment_scores['Negative']} Negative • {sentiment_scores['Neutral']} Neutral\n\n"
        response += "Recent Headlines:\n\n" + "\n\n".join(summaries)
        
        return response
        
    except Exception as e:
        logger.error(f"Error formatting news response for {topic}: {e}")
        return f"✅ Found news for '{topic}', but there was an issue formatting the response."
    
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

# Enhanced session management
sessions = {}
MAX_CHAT_HISTORY = 20  # Limit chat history to prevent memory issues
SESSION_TIMEOUT = 3600  # 1 hour in seconds

def cleanup_old_sessions():
    """Remove old sessions to prevent memory leaks"""
    current_time = datetime.now().timestamp()
    expired_sessions = []
    
    for session_id, session_data in sessions.items():
        if current_time - session_data.get("last_activity", 0) > SESSION_TIMEOUT:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del sessions[session_id]
        logger.info(f"Cleaned up expired session: {session_id}")

def get_or_create_session(session_id: str):
    """Get existing session or create a new one with proper error handling"""
    try:
        # Cleanup old sessions periodically
        if len(sessions) > 100:  # Arbitrary threshold
            cleanup_old_sessions()
        
        if session_id not in sessions:
            logger.info(f"Creating new session: {session_id}")
            sessions[session_id] = {
                "agent": create_finbot_agent(session_id),
                "chat_history": [],
                "created_at": datetime.now().timestamp(),
                "last_activity": datetime.now().timestamp()
            }
        else:
            # Update last activity
            sessions[session_id]["last_activity"] = datetime.now().timestamp()
            
            # Trim chat history if it gets too long
            if len(sessions[session_id]["chat_history"]) > MAX_CHAT_HISTORY:
                sessions[session_id]["chat_history"] = sessions[session_id]["chat_history"][-MAX_CHAT_HISTORY:]
                logger.info(f"Trimmed chat history for session {session_id}")
        
        return sessions[session_id]
        
    except Exception as e:
        logger.error(f"Error managing session {session_id}: {e}")
        raise

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





@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    start_time = datetime.now()
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
    
    # Rate limiting check
    if is_rate_limited(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return jsonify({
            "error": "Rate limit exceeded. Please try again in a minute.",
            "retry_after": 60
        }), 429
    
    try:
        # Validate request data
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "Empty request body"}), 400
            
        user_input = data.get("message", "").strip()
        session_id = data.get("session_id", "default")
        
        # Sanitize inputs
        user_input = sanitize_input(user_input)
        session_id = re.sub(r'[^a-zA-Z0-9\-_]', '', session_id)[:50]  # Clean session ID
        
        logger.info(f"Chat request from session {session_id} (IP: {client_ip}): {user_input[:50]}...")
        
        # Validate input
        if not user_input:
            return jsonify({"error": "No message provided"}), 400
        
        if len(user_input) > 1000:
            return jsonify({"error": "Message too long. Please limit to 1000 characters."}), 400
            
        # Get or create session
        session_data = get_or_create_session(session_id)
        chat_history = session_data["chat_history"]
        
        # Invoke the agent with timeout
        try:
            response = session_data["agent"].invoke({
                "input": user_input,
                "chat_history": chat_history
            })
            
            response_text = response.get("output", "I couldn't generate a response. Please try again.")
            
            # Sanitize response
            response_text = html.escape(response_text) if response_text else "No response generated."
            
            # Update chat history
            session_data["chat_history"].append(HumanMessage(content=user_input))
            session_data["chat_history"].append(AIMessage(content=response_text))
            
            # Log response time
            response_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Response generated in {response_time:.2f}s for session {session_id}")
            
            return jsonify({
                "response": response_text,
                "session_id": session_id,
                "response_time": f"{response_time:.2f}s"
            })
            
        except Exception as agent_error:
            logger.error(f"Agent error for session {session_id}: {agent_error}")
            
            # Provide a helpful fallback response
            fallback_response = ("I'm experiencing some technical difficulties right now. "
                               "Please try rephrasing your question or try again in a moment. "
                               "You can ask me about stock prices, market news, or general financial topics.")
            
            return jsonify({
                "response": fallback_response,
                "session_id": session_id,
                "error": "agent_error"
            }), 200

    except Exception as e:
        error_message = str(e)
        logger.error(f"Backend error from IP {client_ip}: {error_message}")
        
        # Don't expose internal errors to the user
        user_friendly_error = ("I'm sorry, but I'm experiencing technical difficulties. "
                             "Please try again in a moment.")
        
        return jsonify({
            "error": user_friendly_error,
            "session_id": data.get("session_id", "unknown") if 'data' in locals() else "unknown"
        }), 500

# Add health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test basic functionality
        test_response = "FinBot API is healthy"
        
        return jsonify({
            "status": "healthy",
            "message": test_response,
            "timestamp": datetime.now().isoformat(),
            "active_sessions": len(sessions),
            "cache_size": len(api_cache)
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500


if __name__ == "__main__":
    logger.info("Starting FinBot backend server...")
    logger.info(f"Active sessions: {len(sessions)}")
    logger.info(f"Cache entries: {len(api_cache)}")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5001)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise