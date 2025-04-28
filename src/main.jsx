import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import { AuthProvider } from './context/AuthContext'; // ✅ existing
import { TodoProvider } from './context/TodoContext'; // ✅ make sure you renamed the file


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <TodoProvider>
        <App />
      </TodoProvider>
    </AuthProvider>
  </StrictMode>
);
