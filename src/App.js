import React, { useState } from 'react';
import './login.css';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [user, setUser] = useState(null);

  const BACKEND_URL = 'http://localhost:5000';

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Agregar datos ZKP al usuario si están disponibles
        const userData = {
          ...data.user,
          did: data.did || null,
          zkpData: data.zkpData || null
        };
        setUser(userData);
        setCurrentView('dashboard');
      } else {
        alert(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    }
  };

  // Función para registro
  const handleRegister = async (name, email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Guardar datos ZKP y DID generados
        const userData = {
          ...data.user,
          did: data.did,
          zkpData: data.zkpData
        };
        setUser(userData);
        setCurrentView('dashboard');
        alert('¡Cuenta creada! Tu DID: ' + data.did);
      } else {
        alert(data.error || 'Error al crear cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    }
  };

  // Función para conectar wallet
  const handleWalletLogin = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const walletAddress = accounts[0];

        // Enviar al backend para crear/obtener DID
        const response = await fetch(`${BACKEND_URL}/api/wallet-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            walletAddress,
            name: `Wallet ${walletAddress.slice(0, 6)}...`
          })
        });

        const data = await response.json();

        if (data.success) {
          const userData = {
            ...data.user,
            address: walletAddress,
            did: data.did,
            zkpData: data.zkpData,
            credential: data.credential
          };
          setUser(userData);
          setCurrentView('dashboard');
          alert('¡Wallet conectada! Tu DID: ' + data.did);
        } else {
          alert(data.error || 'Error al conectar wallet');
        }
      } else {
        alert('MetaMask no está instalado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error conectando wallet');
    }
  };

  // Función para logout
  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  return (
    <div className="App">
      {currentView === 'login' && (
        <LoginScreen 
          onLogin={handleLogin}
          onWalletLogin={handleWalletLogin}
          onShowRegister={() => setCurrentView('register')}
        />
      )}
      
      {currentView === 'register' && (
        <RegisterScreen 
          onRegister={handleRegister}
          onShowLogin={() => setCurrentView('login')}
        />
      )}
      
      {currentView === 'dashboard' && (
        <DashboardScreen 
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// Componente de Login
function LoginScreen({ onLogin, onWalletLogin, onShowRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      alert('Completa todos los campos');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          
          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>
        
        <div className="divider">O</div>
        
        <button onClick={onWalletLogin} className="btn-wallet">
          🦊 Conectar Wallet
        </button>
        
        <p className="switch-text">
          ¿No tienes cuenta? 
          <span onClick={onShowRegister} className="link">Regístrate</span>
        </p>
      </div>
    </div>
  );
}

// Componente de Registro
function RegisterScreen({ onRegister, onShowLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && password) {
      if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      onRegister(name, email, password);
    } else {
      alert('Completa todos los campos');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Crear Cuenta</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          
          <input 
            type="password" 
            placeholder="Contraseña (min 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          
          <button type="submit" className="btn-primary">
            Crear Cuenta
          </button>
        </form>
        
        <p className="switch-text">
          ¿Ya tienes cuenta? 
          <span onClick={onShowLogin} className="link">Inicia Sesión</span>
        </p>
      </div>
    </div>
  );
}

// Componente del Dashboard
function DashboardScreen({ user, onLogout }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Sistema ZKP</h1>
        <div className="user-info">
          {user.type === 'wallet' ? (
            <span>🦊 {user.address}</span>
          ) : (
            <span>👤 Hola, {user.name}</span>
          )}
          <button onClick={onLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <h2>¡Bienvenido!</h2>
        <p>Has iniciado sesión correctamente</p>
        
        {/* Mostrar información ZKP si está disponible */}
        {user.did && (
          <div className="zkp-info">
            <h3>🔐 Tu Identidad ZKP</h3>
            <div className="info-box">
              <p><strong>DID:</strong></p>
              <code>{user.did}</code>
            </div>
            {user.zkpData && (
              <div className="info-box">
                <p><strong>Estado:</strong> {user.zkpData.state || 'Activo'}</p>
                <p><strong>Tipo:</strong> {user.type}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="features">
          <div className="feature-card">
            <h3>🔐 Pruebas ZKP</h3>
            <p>Crear pruebas de conocimiento cero</p>
            {user.did && (
              <small>DID disponible ✓</small>
            )}
          </div>
          
          <div className="feature-card">
            <h3>📊 Estadísticas</h3>
            <p>Ver tu actividad</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
