import { useState } from 'react';
import axios from 'axios';

const Auth = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const url = isLoginView 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`
        : `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`;

      const response = await axios.post(url, { email, password });
      
      setMessage(response.data.msg);
      // Call the parent component's function to update the user and token state
      onAuthSuccess(response); 

    } catch (error) {
      setMessage(error.response?.data?.msg || 'An error occurred.');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLoginView ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isLoginView ? 'Login' : 'Register'}
        </button>
      </form>
      <p className="auth-message">{message}</p>
      <button 
        className="toggle-auth-button"
        onClick={() => setIsLoginView(!isLoginView)}
      >
        {isLoginView ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
    </div>
  );
};

export default Auth;