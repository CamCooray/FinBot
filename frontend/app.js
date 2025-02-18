async function sendMessage() {
    const userInput = document.getElementById("userInput").value.trim();
    const chatbox = document.getElementById("chatbox");

    if (!userInput) return;

    // Display user message
    chatbox.innerHTML += `<div class="user-message"><strong>You:</strong> ${userInput}</div>`;

    // Clear input field
    document.getElementById("userInput").value = "";

    // Send message to Flask backend
    try {
        const response = await fetch("http://127.0.0.1:5500/frontend/index.html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userInput })
        });

        const data = await response.json();
        chatbox.innerHTML += `<div class="bot-message"><strong>FinBot:</strong> ${data.response}</div>`;

    } catch (error) {
        chatbox.innerHTML += `<div class="bot-message error"><strong>Error:</strong> Failed to connect</div>`;
    }

    // Auto-scroll to the latest message
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Enable "Enter" key to send message
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}
