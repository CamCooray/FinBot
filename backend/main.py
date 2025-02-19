from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)

# Allow requests from frontend (127.0.0.1:5500)
CORS(app, resources={r"/chat": {"origins": "http://127.0.0.1:5500"}})

openai.api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI(api_key=openai.api_key)  # Ensure client has the API key

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_input = data.get("message")

        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are FinBot, a helpful financial assistant."},
                {"role": "user", "content": user_input}
            ]
        )

        chatbot_reply = response.choices[0].message.content
        return jsonify({"response": chatbot_reply})

    except Exception as e:
        print(f"Backend error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)