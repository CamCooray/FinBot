# Security Guidelines for FinBot

## Environment Variables
- Never commit actual API keys to version control
- Use `.env` files locally and environment variables in production
- Rotate API keys regularly

## API Security
- Rate limiting implemented: 30 requests per minute per IP
- Input sanitization to prevent injection attacks
- CORS properly configured for production vs development
- All user inputs are validated and sanitized

## Deployment Security
- Use HTTPS in production
- Set FLASK_ENV=production for production deployments
- Implement proper logging and monitoring
- Regular security updates for dependencies

## API Keys Required
1. OpenAI API Key - Get from: https://platform.openai.com/api-keys
2. Alpha Vantage API Key - Get from: https://www.alphavantage.co/support/#api-key
3. News API Key - Get from: https://newsapi.org/register

## Before Going Live
- [ ] Regenerate all API keys
- [ ] Set FLASK_ENV=production
- [ ] Update CORS origins to production domains only
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerting
