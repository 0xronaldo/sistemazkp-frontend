import React, { useState, useEffect } from 'react';
import './login.css';

// Importar funciones de los componentes
import { registerUser, loginUser, logoutUser, getCurrentUser } from './components/athenticacion';
import { connectWallet, authenticateWithWallet } from './components/logicadewallet';
import { formatDIDShort, getDIDDisplayInfo } from './components/bidi';
import JsonViewer from './components/json-viewer';

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
      console.log('[App] Iniciando verificación ZKP...');
      console.log('[App] Usuario completo:', JSON.stringify(user, null, 2));
      
      if (!user.credential) {
        throw new Error('No tienes credencial disponible. Por favor, registrate o inicia sesión.');
      }

      console.log('[App] Credencial recibida:', JSON.stringify(user.credential, null, 2));
      console.log('[App] Tiene credentialSubject?', !!user.credential.credentialSubject);
      console.log('[App] Tiene issuer?', !!user.credential.issuer);
      console.log('[App] Tiene id?', !!user.credential.id);

      if (!user.credential.credentialSubject) {
        console.error('[App] CREDENCIAL INCOMPLETA:', user.credential);
        throw new Error('La credencial no tiene credentialSubject. Esto significa que el backend no devolvió la credencial completa. Verifica los logs del backend.');
      }

      // Importar el generador ZKP
      const zkpGen = await import('./components/zkp-generator');

      // Obtener el issuer DID
      const issuerDID = user.credential.issuer || user.zkpData?.identifier || user.did;
      console.log('[App] 📝 Issuer DID:', issuerDID);

            // Generar prueba de verificación
      const result = await zkpGen.generateIsVerifiedProof(user.credential, issuerDID);

      console.log('[App] ✅ Verificación completada:', result);

      // Manejar tanto éxitos como errores del backend
      if (result.success === false || !result.verified) {
        // Verificación falló
        setProofResult({
          success: false,
          verified: false,
          error: result.error || result.message,
          stage: result.stage
        });
        alert(`❌ Verificación fallida:\n${result.error || result.message}`);
      } else {
        // Verificación exitosa - GUARDAR TODOS LOS DATOS
        console.log('[App] 📊 RESULTADO COMPLETO:', result);
        console.log('[App] 📊 fullData recibido?', !!result.fullData);
        console.log('[App] 📊 fullData contenido:', result.fullData);
        
        setProofResult({
          success: true,
          verified: result.verified,
          proof: result.proof,
          fullData: result.fullData, // ← NUEVO: Datos completos para JSON viewer
          message: result.message,
          warning: result.warning,
          localVerification: result.localVerification
        });

        // Mensaje detallado según el tipo de verificación
        const verificationMethod = result.proof?.method === 'issuer-node' 
          ? 'verificada con Issuer Node (on-chain) 🔗' 
          : 'verificada localmente (estructura) 📝';
        
        const warningMsg = result.warning ? `\n\n⚠️ ${result.warning}` : '';
        alert(`✅ Identidad ${verificationMethod}\n\n${result.message}${warningMsg}`);
      }

    } catch (error) {
      console.error('[App] Error inesperado:', error);
      console.error('[App] Stack:', error.stack);
      setProofResult({
        success: false,
        verified: false,
        error: error.message || 'Error inesperado en la verificación'
      });
      alert(`Error inesperado: ${error.message}`);
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
            title="Identidad Descentralizada (DID)" 
            data={didData}
            defaultExpanded={true}
          />
        )}

        {/* Desplegador para Verifiable Credential */}
        {user.credential && (
          <JSONCollapsible 
            title="Credencial Verificable (VC)" 
            data={vcData}
            defaultExpanded={false}
          />
        )}

        {/* Desplegador para ZKP State */}
        <JSONCollapsible 
          title="Estado ZKP (Claims Tree)" 
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

        {/* Botón ÚNICO para verificar credencial desde wallet */}
        {user.credential && (
          <div className="zkp-info">
            <h3>🔐 Verificar Credencial ZKP</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Genera una prueba de conocimiento cero para verificar tu identidad sin revelar datos personales
            </p>
            <button 
              onClick={() => handleGenerateProof('verification')}
              disabled={generatingProof}
              className="btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '16px' }}
            >
              {generatingProof ? ' Generando prueba ZKP...' : '🔐 Verificar Identidad con ZKP'}
            </button>
            
            {proofResult && (
              <div style={{
                marginTop: '15px',
                padding: '20px',
                background: proofResult.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${proofResult.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '8px'
              }}>
                {proofResult.success ? (
                  <>
                    <p style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                      ✅ Resultado: {proofResult.message}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Verificado:</strong> {proofResult.verified ? 'SÍ ✓' : 'NO ✗'}
                    </p>
                    {proofResult.proof && (
                      <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '5px', fontSize: '13px' }}>
                        <p><strong>📋 Detalles de Verificación:</strong></p>
                        {proofResult.proof.method && (
                          <p>• Método: {proofResult.proof.method === 'issuer-node' ? 'Issuer Node (on-chain)' : 'Local'}</p>
                        )}
                        {proofResult.proof.credentialId && (
                          <p>• ID Credencial: {proofResult.proof.credentialId.substring(0, 20)}...</p>
                        )}
                        {proofResult.proof.subject && (
                          <p>• Subject: {proofResult.proof.subject.substring(0, 30)}...</p>
                        )}
                        {proofResult.proof.notRevoked !== undefined && (
                          <p>• No revocada: {proofResult.proof.notRevoked ? '✓' : '✗'}</p>
                        )}
                        {proofResult.proof.timestamp && (
                          <p>• Verificado: {new Date(proofResult.proof.timestamp).toLocaleString()}</p>
                        )}
                        
                        {/* Mostrar información del ZKP Proof si está disponible */}
                        {proofResult.proof.zkpProof && proofResult.proof.zkpProof.proofs && proofResult.proof.zkpProof.proofs.length > 0 && (
                          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ccc' }}>
                            <p><strong>🔐 Prueba Criptográfica ZKP:</strong></p>
                            {proofResult.proof.zkpProof.proofs.map((proof, idx) => (
                              <div key={idx} style={{ marginLeft: '10px', marginTop: '8px' }}>
                                <p>• <strong>Tipo:</strong> {proof.type}</p>
                                {proof.signature && (
                                  <p>• <strong>Firma BJJ:</strong> {proof.signature}</p>
                                )}
                                {proof.coreClaim && (
                                  <p>• <strong>Core Claim:</strong> {proof.coreClaim}</p>
                                )}
                                {proof.issuerData && (
                                  <>
                                    <p>• <strong>Issuer ID:</strong> {proof.issuerData.id?.substring(0, 25)}...</p>
                                    {proof.issuerData.state?.claimsTreeRoot && (
                                      <p>• <strong>Claims Tree Root:</strong> {proof.issuerData.state.claimsTreeRoot.substring(0, 20)}...</p>
                                    )}
                                    {proof.issuerData.mtp && (
                                      <p>• <strong>MTP:</strong> Existence: {proof.issuerData.mtp.existence ? '✓' : '✗'}, Siblings: {proof.issuerData.mtp.siblingsCount}</p>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* JSON VIEWER - Mostrar datos completos */}
                    {proofResult.fullData && (
                      <div style={{ marginTop: '20px' }}>
                        <JsonViewer 
                          data={proofResult.fullData} 
                          title="📊 Datos Completos de Verificación (JSON)"
                        />
                      </div>
                    )}
                    
                    {/* DEBUG: Mostrar si fullData NO está disponible */}
                    {!proofResult.fullData && (
                      <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#856404' }}>
                          ⚠️ DEBUG: No hay fullData disponible. 
                          Verifica que el backend esté devolviendo el campo 'fullData'.
                        </p>
                      </div>
                    )}
                    
                    {proofResult.warning && (
                      <p style={{ marginTop: '10px', color: '#856404', fontSize: '12px' }}>
                        ⚠️ {proofResult.warning}
                      </p>
                    )}
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
              <small className="status-ok"> DID disponible - Listo para generar pruebas</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
