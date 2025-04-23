# Financial Advisory Chatbot for Retail Investors

https://yourfinbot.vercel.app/

**Author:** Cameron Cooray

## Introduction

Investing in the stock market can be overwhelming, especially for novice investors who struggle to navigate financial jargon, track stock performance, and make informed decisions. Many retail investors turn to online research, social media, or financial news for guidance, but these sources can be inconsistent, confusing, or even misleading.

To address this challenge, I am developing a **Financial Advisory Chatbot** — a web-based AI assistant designed to provide quick, accurate, and easy-to-understand investment insights for retail investors. Unlike basic chatbots that generate generic responses, this chatbot integrates real-time market data, ensuring users receive up-to-date and relevant financial information.

## What the Chatbot Does

The chatbot allows users to ask investment-related questions and receive instant, AI-driven responses powered by GPT-4-turbo. Users can inquire about stock prices, market trends, and investment strategies in a natural, conversational way.

### Example Queries

- What’s the latest price of Tesla (TSLA)?
- Is Apple (AAPL) a good long-term investment?
- What are the key financial metrics for NVIDIA?

### Key Features

- Processes questions using OpenAI’s GPT-4o-mini
- Fetches real-time stock data from Alpha Vantage API
- Retrieve News articls and determine sentiment using NewsAPI
- Analyzes the data and generates AI-powered investment insights
- Displays answers in a clean, user-friendly web interface

## How It Works

The chatbot is built as a full-stack web application using the following technologies:

- Python (Flask+LangChain) for the backend
- Next.js (React) for the frontend
- GPT-4o-mini as the AI model
- Alpha Vantage and NewsAPI for real-time market data + market context

This structure ensures fast response times and a smooth user experience.
