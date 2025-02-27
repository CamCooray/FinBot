from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType, Tool
from langchain.memory import ConversationBufferMemory
from langchain.prompts import MessagesPlaceholder

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Allow requests from frontend
CORS(app, resources={r"/chat": {"origins": "http://127.0.0.1:5500"}})

# Initialize the LLM
llm = ChatOpenAI(
    model_name="gpt-4o-mini",
    temperature=0.7
)

# Alpha Vantage Stock Tool
def get_alpha_vantage_stock(ticker_symbol):
    """Get current stock data for the specified ticker symbol using Alpha Vantage."""
    api_key = os.getenv("ALPHA_API_KEY")
    if not api_key:
        return "Error: Alpha Vantage API key not found in environment variables."
    
    ticker = ticker_symbol.strip().upper()
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
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

# Create tools list
tools = [
    Tool(
        name="StockPrice",
        func=get_alpha_vantage_stock,
        description="Get the current stock price and information for a company using its ticker symbol (e.g., AAPL for Apple, MSFT for Microsoft, AMZN for Amazon)"
    )
]

# Dictionary to store conversation sessions
sessions = {}

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_input = data.get("message")
        session_id = data.get("session_id", "default")

        if not user_input:
            return jsonify({"error": "No input provided"}), 400
            
        # Get or create session
        if session_id not in sessions:
            # Create a new memory for this session
            memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
            
            # Create a new agent for this session
            agent = initialize_agent(
                tools,
                llm,
                agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
                verbose=True,
                memory=memory,
                handle_parsing_errors=True
            )
            
            sessions[session_id] = agent
        
        # Get response from the agent
        response = sessions[session_id].run(
            input=f"""
            As FinBot, a helpful financial assistant, please respond to: {user_input}
            If the user is asking about a stock price or stock information, use the StockPrice tool to get real-time data.
            Always provide helpful financial context around any stock information.
            """
        )
        
        return jsonify({"response": response})

    except Exception as e:
        print(f"Backend error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)