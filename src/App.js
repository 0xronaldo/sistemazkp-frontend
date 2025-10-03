import React, { useState, useEffect } from 'react';
import './login.css';

// Importar funciones de los componentes
import { registerUser, loginUser, logoutUser, getCurrentUser } from './components/athenticacion';
import { connectWallet, authenticateWithWallet } from './components/logicadewallet';
import { formatDIDShort, getDIDDisplayInfo } from './components/bidi';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar si hay usuario guardado al cargar la app
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setCurrentView('dashboard');
    }
  }, []);

  // Handler para login con email/password
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      console.log('[App] Iniciando login...');
      const userData = await loginUser(email, password);
      setUser(userData);
      setCurrentView('dashboard');
      alert('Login exitoso');
    } catch (error) {
      console.error('[App] Error en login:', error);
      alert(error.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  // Handler para registro con email/password
  const handleRegister = async (name, email, password) => {
    setLoading(true);
    try {
      console.log('[App] Iniciando registro...');
      const userData = await registerUser(name, email, password);
      setUser(userData);
      setCurrentView('dashboard');
      
      if (userData.did) {
        alert(`Cuenta creada exitosamente! Tu DID: ${formatDIDShort(userData.did)}`);
      } else {
        alert('Cuenta creada exitosamente!');
      }
    } catch (error) {
      console.error('[App] Error en registro:', error);
      alert(error.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  // Handler para login con wallet
  const handleWalletLogin = async () => {
    setLoading(true);
    try {
      console.log('[App] Conectando wallet...');
      const walletAddress = await connectWallet();
      const userData = await authenticateWithWallet(walletAddress);
      setUser(userData);
      setCurrentView('dashboard');
      
      if (userData.did) {
        alert(`Wallet conectada! Tu DID: ${formatDIDShort(userData.did)}`);
      } else {
        alert('Wallet conectada exitosamente!');
      }
    } catch (error) {
      console.error('[App] Error en wallet login:', error);
      alert(error.message || 'Error al conectar wallet');
    } finally {
      setLoading(false);
    }
  };

  // Handler para logout
  const handleLogout = () => {
    console.log('[App] Cerrando sesion...');
    logoutUser();
    setUser(null);
    setCurrentView('login');
  };

  return (
    <div className="App">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Cargando...</div>
        </div>
      )}

      {currentView === 'login' && (
        <LoginScreen 
          onLogin={handleLogin}
          onWalletLogin={handleWalletLogin}
          onShowRegister={() => setCurrentView('register')}
          loading={loading}
        />
      )}
      
      {currentView === 'register' && (
        <RegisterScreen 
          onRegister={handleRegister}
          onShowLogin={() => setCurrentView('login')}
          loading={loading}
        />
      )}
      
      {currentView === 'dashboard' && user && (
        <DashboardScreen 
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// Componente de Login
function LoginScreen({ onLogin, onWalletLogin, onShowRegister, loading }) {
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
        <h2>Iniciar Sesion</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            disabled={loading}
          />
          
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            disabled={loading}
          />
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="divider">O</div>
        
        <button 
          onClick={onWalletLogin} 
          className="btn-wallet"
          disabled={loading}
        >
          Conectar Wallet
        </button>
        
        <p className="switch-text">
          ¿No tienes cuenta? 
          <span onClick={onShowRegister} className="link">Registrate</span>
        </p>
      </div>
    </div>
  );
}

// Componente de Registro
function RegisterScreen({ onRegister, onShowLogin, loading }) {
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
            disabled={loading}
          />
          
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            disabled={loading}
          />
          
          <input 
            type="password" 
            placeholder="Contraseña (min 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            disabled={loading}
          />
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>
        
        <p className="switch-text">
          ¿Ya tienes cuenta? 
          <span onClick={onShowLogin} className="link">Inicia Sesion</span>
        </p>
      </div>
    </div>
  );
}

// Componente del Dashboard
function DashboardScreen({ user, onLogout }) {
  const didInfo = user.did ? getDIDDisplayInfo(user.did) : null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Sistema ZKP</h1>
        <div className="user-info">
          {user.walletAddress ? (
            <span>Wallet: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
          ) : (
            <span>Hola, {user.name}</span>
          )}
          <button onClick={onLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <h2>Bienvenido</h2>
        <p>Has iniciado sesion correctamente</p>
        
        {didInfo && didInfo.valid && (
          <div className="zkp-info">
            <h3>Tu Identidad Descentralizada (DID)</h3>
            <div className="info-box">
              <p><strong>DID Completo:</strong></p>
              <code className="did-full">{didInfo.full}</code>
            </div>
            <div className="info-box">
              <p><strong>Metodo:</strong> {didInfo.method}</p>
              <p><strong>Red:</strong> {didInfo.network}</p>
              <p><strong>Identificador:</strong> {didInfo.identifier.slice(0, 20)}...</p>
            </div>
          </div>
        )}

        {user.zkpData && (
          <div className="zkp-info">
            <h3>Datos ZKP</h3>
            <div className="info-box">
              <p><strong>Estado:</strong> {user.zkpData.state || 'Activo'}</p>
              <p><strong>Tipo:</strong> {user.type}</p>
              {user.zkpData.timestamp && (
                <p><strong>Creado:</strong> {new Date(user.zkpData.timestamp).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {user.credential && (
          <div className="zkp-info">
            <h3>Credencial Verificable</h3>
            <div className="info-box">
              <p><strong>Tipos:</strong></p>
              <ul>
                {user.credential.type?.map((type, idx) => (
                  <li key={idx}>{type}</li>
                ))}
              </ul>
              {user.credential.credentialSubject && (
                <div>
                  <p><strong>Datos del Sujeto:</strong></p>
                  <p>Metodo de Auth: {user.credential.credentialSubject.authMethod}</p>
                  <p>Estado: {user.credential.credentialSubject.accountState}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="features">
          <div className="feature-card">
            <h3>Pruebas ZKP</h3>
            <p>Crear pruebas de conocimiento cero</p>
            {user.did && (
              <small className="status-ok">DID disponible</small>
            )}
          </div>
          
          <div className="feature-card">
            <h3>Estadisticas</h3>
            <p>Ver tu actividad</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
