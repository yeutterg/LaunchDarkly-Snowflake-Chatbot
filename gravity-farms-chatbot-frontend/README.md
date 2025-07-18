# Gravity Farms Petfood Chat Widget

This is the React chat widget component for the Gravity Farms Petfood website. It provides a simple, floating chat interface that connects to the backend API service.

## 🚀 Quick Start

### Option 1: Run Complete Demo

```bash
# From the project root directory
docker-compose --profile demo up

# This starts both:
# 📱 Frontend Demo: http://localhost:3000
# 🔌 Backend API: http://localhost:3001
```

### Option 2: Integrate the Widget into Your App

**For Existing React App:**

1. **Copy the ChatWidget component** to your React app:
   ```bash
   cp -r gravity-farms-chatbot-frontend/src/components/ChatWidget.js your-app/src/components/
   cp -r gravity-farms-chatbot-frontend/src/components/ChatWidget.css your-app/src/components/
   ```

2. **Add to your main App component**:
   ```javascript
   import ChatWidget from './components/ChatWidget';

   function App() {
     return (
       <div className="App">
         {/* Your existing components */}
         
         <ChatWidget />
       </div>
     );
   }
   ```

3. **Set the backend API URL** in your `.env` file:
   ```bash
   REACT_APP_API_URL=http://localhost:3001
   ```

That's it! The chat widget will appear as a floating button in the bottom-right corner.

### 3. Test the Complete Setup

```bash
# Run both backend and a demo frontend
docker-compose --profile demo up

# Backend: http://localhost:3001
# Frontend Demo: http://localhost:3000
```

## Features

- **Floating Chat Button**: Unobtrusive chat icon with notification badge
- **Expandable Chat Window**: Full chat interface with message history
- **Quick Actions**: Pre-defined buttons for common queries
- **Real-time Messaging**: Instant communication with the backend
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Maintains chat history during the session
- **Error Handling**: Graceful fallbacks for connection issues

## Customization

### Styling
The chat widget uses CSS variables that you can override in your app:

```css
:root {
  --chat-primary-color: #4CAF50;
  --chat-primary-hover: #45a049;
  --chat-window-width: 380px;
  --chat-window-height: 600px;
}
```

### Position
To change the position of the chat button, modify the CSS:

```css
.chat-button {
  bottom: 24px;  /* Adjust vertical position */
  right: 24px;   /* Adjust horizontal position */
}
```

### Quick Actions
Modify the `quickActions` array in `ChatWidget.js`:

```javascript
const quickActions = [
  { label: 'Track Order', message: 'I need help tracking my order' },
  { label: 'Product Info', message: 'I have a question about your products' },
  { label: 'Returns', message: 'I need to return an item' },
  // Add more actions here
];
```

## User Email Integration

If your app has user authentication, you can pass the user's email to the chat widget by storing it in localStorage:

```javascript
// After user login
localStorage.setItem('userEmail', user.email);
```

The chat widget will automatically use this email for order lookups.

## Mobile Responsiveness

On mobile devices (< 480px width), the chat window expands to full screen for better usability.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Chat not connecting
- Verify `REACT_APP_API_URL` is set correctly
- Ensure the backend service is running
- Check browser console for errors

### Styles not loading
- Ensure `ChatWidget.css` is imported in the component
- Check for CSS conflicts with your existing styles

### Session issues
- Clear browser localStorage if experiencing session problems
- Check that cookies are enabled

## Development

To test the widget standalone:

```bash
# Install dependencies
npm install

# Run development server
npm start
```

## License

Copyright (c) 2024 Gravity Farms Petfood