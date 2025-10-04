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
      setCurrentView('pagina_session');
    }
  }, []);

  // Handler para login con email/password
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      console.log('[App] Iniciando login...');
      const userData = await loginUser(email, password);
      setUser(userData);
      setCurrentView('pagina_session');
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
      setCurrentView('pagina_session');
      
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
      
      // Importar función de firma
      const { connectAndAuthenticate } = await import('./components/logicadewallet');
      
      // Conectar, firmar y autenticar en un solo paso
      const userData = await connectAndAuthenticate(true); // true = requiere firma
      
      setUser(userData);
      setCurrentView('pagina_session');
      
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
      
      {currentView === 'pagina_session' && user && (
        <PaginaSession 
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

// Componente de desplegador JSON simple
function JSONCollapsible({ title, data, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '15px',
          background: '#f5f5f5',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span><strong>{isExpanded ? '▼' : '▶'} {title}</strong></span>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {isExpanded ? 'Ocultar' : 'Ver'}
        </span>
      </div>
      {isExpanded && (
        <div style={{ padding: '15px', background: '#fff' }}>
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '3px',
            overflow: 'auto',
            fontSize: '13px',
            margin: 0
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Componente de Pagina de Session
function PaginaSession({ user, onLogout }) {
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofResult, setProofResult] = useState(null);
  
  const didInfo = user.did ? getDIDDisplayInfo(user.did) : null;

  // Preparar datos para DID (datos reales del backend)
  const didData = {
    did: user.did,
    info: didInfo,
    createdAt: user.timestamp || user.createdAt
  };

  // Preparar datos para VC (Verifiable Credential) - datos reales del backend
  const vcData = {
    credential: user.credential,
    zkpData: user.zkpData,
    type: user.type,
    user: {
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      state: user.state
    }
  };

  // Preparar datos para ZKP - datos reales del backend
  const zkpProofsData = user.zkpData || {
    identifier: user.did,
    state: 'No disponible'
  };

  // Handler para generar prueba ZKP
  const handleGenerateProof = async (proofType) => {
    setGeneratingProof(true);
    setProofResult(null);

    try {
      console.log('[App] Generando prueba ZKP tipo:', proofType);

      // Importar el generador ZKP
      const zkpGen = await import('./components/zkp-generator');

      if (!user.credential) {
        throw new Error('No tienes credencial disponible');
      }

      // Obtener el issuer DID (del estado o usar uno por defecto)
      const issuerDID = user.zkpData?.identifier || user.did;

      let proof;
      
      switch (proofType) {
        case 'authMethod':
          proof = await zkpGen.generateAuthMethodProof(
            user.credential,
            issuerDID,
            user.credential.credentialSubject?.authMethod || 'email'
          );
          break;
        
        case 'verified':
          proof = await zkpGen.generateIsVerifiedProof(user.credential, issuerDID);
          break;
        
        case 'accountState':
          proof = await zkpGen.generateAccountStateProof(user.credential, issuerDID, 'active');
          break;
        
        default:
          throw new Error('Tipo de prueba no soportado');
      }

      console.log('[App] ✅ Prueba generada:', proof);

      // Enviar al backend para verificación
      const verificationResult = await zkpGen.sendProofToBackend(proof);

      setProofResult({
        success: true,
        verified: verificationResult.verified,
        proof: proof,
        message: verificationResult.message
      });

      alert(`✅ Prueba generada y verificada: ${verificationResult.verified ? 'VÁLIDA' : 'INVÁLIDA'}`);

    } catch (error) {
      console.error('[App] ❌ Error generando prueba:', error);
      setProofResult({
        success: false,
        error: error.message
      });
      alert(`❌ Error: ${error.message}`);
    } finally {
      setGeneratingProof(false);
    }
  };

  return (
    <div className="pagina-session">
      <div className="pagina-session-header">
        <h1>Sistema ZKP</h1>
        <div className="user-info">
          {user.walletAddress ? (
            <span>Wallet: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
          ) : (
            <span>Usuario: {user.name}</span>
          )}
          <button onClick={onLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </div>
      
      <div className="pagina-session-content">
        <h2>Sistema de Pruebas de Conocimiento Cero</h2>
        <p>Sesión iniciada como {user.walletAddress ? 'wallet' : 'usuario'}: {user.walletAddress ? user.walletAddress : user.name}</p>
        
        {/* Desplegador para DID */}
        {user.did && (
          <JSONCollapsible 
            title="🆔 Identidad Descentralizada (DID)" 
            data={didData}
            defaultExpanded={true}
          />
        )}

        {/* Desplegador para Verifiable Credential */}
        {user.credential && (
          <JSONCollapsible 
            title="📜 Credencial Verificable (VC)" 
            data={vcData}
            defaultExpanded={false}
          />
        )}

        {/* Desplegador para ZKP State */}
        <JSONCollapsible 
          title="🔐 Estado ZKP (Claims Tree)" 
          data={zkpProofsData}
          defaultExpanded={false}
        />

        {/* Resumen visual */}
        {didInfo && didInfo.valid && (
          <div className="zkp-info">
            <h3>Resumen de tu Identidad</h3>
            <div className="info-box">
              <p><strong>DID:</strong> <code>{didInfo.full}</code></p>
              <p><strong>Método:</strong> {didInfo.method}</p>
              <p><strong>Red:</strong> {didInfo.network}</p>
            </div>
          </div>
        )}

        {user.credential && (
          <div className="zkp-info">
            <h3>Estado de Credencial</h3>
            <div className="info-box">
              <p><strong>Tipos:</strong> {user.credential.type?.join(', ')}</p>
              {user.credential.credentialSubject && (
                <>
                  <p><strong>Método Auth:</strong> {user.credential.credentialSubject.authMethod}</p>
                  <p><strong>Estado Cuenta:</strong> {user.credential.credentialSubject.accountState}</p>
                  <p><strong>Verificado:</strong> {user.credential.credentialSubject.isVerified ? '✅ Sí' : '⏳ Pendiente'}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botones para generar pruebas ZKP */}
        {user.credential && (
          <div className="zkp-info">
            <h3>🔐 Generar Pruebas ZKP</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
              <button 
                onClick={() => handleGenerateProof('authMethod')}
                disabled={generatingProof}
                className="btn-primary"
                style={{ flex: '1', minWidth: '150px' }}
              >
                {generatingProof ? 'Generando...' : 'Probar Método Auth'}
              </button>
              
              <button 
                onClick={() => handleGenerateProof('accountState')}
                disabled={generatingProof}
                className="btn-primary"
                style={{ flex: '1', minWidth: '150px' }}
              >
                {generatingProof ? 'Generando...' : 'Probar Estado Activo'}
              </button>
              
              <button 
                onClick={() => handleGenerateProof('verified')}
                disabled={generatingProof}
                className="btn-primary"
                style={{ flex: '1', minWidth: '150px' }}
              >
                {generatingProof ? 'Generando...' : 'Probar Verificado'}
              </button>
            </div>
            
            {proofResult && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                background: proofResult.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${proofResult.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '5px'
              }}>
                {proofResult.success ? (
                  <>
                    <p><strong>✅ Resultado:</strong> {proofResult.message}</p>
                    <p><strong>Verificado:</strong> {proofResult.verified ? 'SÍ ✓' : 'NO ✗'}</p>
                  </>
                ) : (
                  <p><strong>❌ Error:</strong> {proofResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="features">
          <div className="feature-card">
            <h3>🔐 Pruebas ZKP</h3>
            <p>Genera pruebas de conocimiento cero para verificar atributos sin revelar datos</p>
            {user.did && (
              <small className="status-ok">✅ DID disponible - Listo para generar pruebas</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
