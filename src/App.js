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
      
      // Mostrar mensaje de éxito con verificación ZKP obligatoria
      let message = '✅ Acceso concedido\n\n🔐 Tu credencial ZKP ha sido verificada exitosamente';
      message += `\n   Método: Issuer Node (on-chain)`;
      message += `\n   Estado: ${userData.zkpVerificationDetails?.details?.notRevoked ? 'No revocada ✓' : 'Verificando...'}`;
      alert(message);
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
      
      // Mostrar mensaje con verificación ZKP automática
      let message = `Cuenta creada exitosamente!`;
      if (userData.did) {
        message += `\n\n Tu DID: ${formatDIDShort(userData.did)}`;
      }
      if (userData.zkpVerified) {
        message += `\n\n Tu credencial ZKP ha sido verificada automáticamente ✓`;
        message += `\n   Método: Issuer Node (on-chain)`;
      }
      alert(message);
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

// Componente de desplegador JSON simple y minimalista
function JSONCollapsible({ title, data, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: '15px', border: '1px solid #ccc' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '10px',
          background: '#fff',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isExpanded ? '1px solid #ccc' : 'none'
        }}
      >
        <span>{isExpanded ? '▼' : '▶'} {title}</span>
      </div>
      {isExpanded && (
        <div style={{ padding: '10px', background: '#fff' }}>
          <pre style={{
            background: '#fff',
            padding: '10px',
            overflow: 'auto',
            fontSize: '12px',
            margin: 0,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
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

  // Preparar datos para VC (Verifiable Credential) - COMPLETA como la emite Issuer Node
  const vcData = user.credential || {
    message: 'Credencial no disponible'
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
          warning: result.warning
        });

        // Mensaje detallado según el tipo de verificación
        const verificationMethod = 'verificada con Issuer Node (on-chain) 🔗';
        
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

        {/* Desplegador para Verifiable Credential COMPLETA */}
        {user.credential && (
          <JSONCollapsible 
            title={`Credencial Verificable ${user.credential.proof ? '( Proof Issuer)' : '( Sin Proof )'}`}
            data={vcData}
            defaultExpanded={true}
          />
        )}

        {/* Desplegador para ZKP State */}
        <JSONCollapsible 
          title="Estado ZKP (Claims Tree)" 
          data={zkpProofsData}
          defaultExpanded={false}
        />
        
        {/* Mostrar datos completos de verificación ZKP si está disponible */}
        {user.zkpVerificationDetails?.fullData && (
          <div style={{ marginTop: '20px' }}>
            <JsonViewer 
              data={user.zkpVerificationDetails.fullData} 
              title="🔐 Verificación ZKP Automática (Datos Completos)"
            />
          </div>
        )}

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
              
              {/* ESTADO DE VERIFICACIÓN ZKP AUTOMÁTICA */}
              {user.zkpVerified !== undefined && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '15px', 
                  background: '#f8f9fa',
                  border: '2px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#212529' }}>
                    {user.zkpVerified ? '🔐 Verificación ZKP: VERIFICADA ✓' : '⚠️ Verificación ZKP: PENDIENTE'}
                  </p>
                  {user.zkpVerificationDetails && (
                    <>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#495057' }}>
                        <strong>Método:</strong> Issuer Node (on-chain)
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#495057' }}>
                        <strong>Verificado:</strong> {new Date(user.zkpVerificationDetails.timestamp).toLocaleString()}
                      </p>
                      {user.zkpVerificationDetails.details?.notRevoked !== undefined && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#495057' }}>
                          <strong>No Revocada:</strong> {user.zkpVerificationDetails.details.notRevoked ? '✓ Sí' : '✗ No'}
                        </p>
                      )}
                    </>
                  )}
                </div>
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
                padding: '15px',
                background: 'white',
                border: '1px solid #ccc'
              }}>
                {proofResult.success ? (
                  <>
                    <p style={{ marginBottom: '10px', fontSize: '14px', color: '#000' }}>
                      Resultado: {proofResult.message}
                    </p>
                    <p style={{ marginBottom: '8px', color: '#000' }}>
                      Verificado: {proofResult.verified ? 'SI' : 'NO'}
                    </p>
                    {proofResult.proof && (
                      <div style={{ marginTop: '15px', padding: '10px', background: 'white', border: '1px solid #ddd', fontSize: '12px' }}>
                        <p style={{ color: '#000', marginBottom: '8px' }}>Detalles:</p>
                        {proofResult.proof.method && (
                          <p style={{ color: '#000' }}>- Metodo: Issuer Node (on-chain)</p>
                        )}
                        {proofResult.proof.credentialId && (
                          <p style={{ color: '#000' }}>- ID Credencial: {proofResult.proof.credentialId.substring(0, 20)}...</p>
                        )}
                        {proofResult.proof.subject && (
                          <p style={{ color: '#000' }}>- Subject: {proofResult.proof.subject.substring(0, 30)}...</p>
                        )}
                        {proofResult.proof.notRevoked !== undefined && (
                          <p style={{ color: '#000' }}>- No revocada: {proofResult.proof.notRevoked ? 'Si' : 'No'}</p>
                        )}
                        {proofResult.proof.timestamp && (
                          <p style={{ color: '#000' }}>- Verificado: {new Date(proofResult.proof.timestamp).toLocaleString()}</p>
                        )}
                        
                        {/* Mostrar información del ZKP Proof si está disponible */}
                        {proofResult.proof.zkpProof && proofResult.proof.zkpProof.proofs && proofResult.proof.zkpProof.proofs.length > 0 && (
                          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                            <p style={{ color: '#000', marginBottom: '8px' }}>Prueba Criptografica ZKP:</p>
                            {proofResult.proof.zkpProof.proofs.map((proof, idx) => (
                              <div key={idx} style={{ marginLeft: '10px', marginTop: '8px' }}>
                                <p style={{ color: '#000' }}>- Tipo: {proof.type}</p>
                                {proof.signature && (
                                  <p style={{ color: '#000', wordBreak: 'break-all' }}>- Firma BJJ: {proof.signature}</p>
                                )}
                                {proof.coreClaim && (
                                  <p style={{ color: '#000', wordBreak: 'break-all' }}>- Core Claim: {proof.coreClaim}</p>
                                )}
                                {proof.issuerData && (
                                  <>
                                    <p style={{ color: '#000' }}>- Issuer ID: {proof.issuerData.id?.substring(0, 25)}...</p>
                                    {proof.issuerData.state?.claimsTreeRoot && (
                                      <p style={{ color: '#000' }}>- Claims Tree Root: {proof.issuerData.state.claimsTreeRoot.substring(0, 20)}...</p>
                                    )}
                                    {proof.issuerData.mtp && (
                                      <p style={{ color: '#000' }}>- MTP: Existence: {proof.issuerData.mtp.existence ? 'Si' : 'No'}, Siblings: {proof.issuerData.mtp.siblingsCount}</p>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* JSON VIEWER - Mostrar datos completos SIN BOTON DE DESCARGA */}
                    {proofResult.fullData && (
                      <div style={{ marginTop: '20px' }}>
                        <JsonViewer 
                          data={proofResult.fullData} 
                          title="Datos Completos de Verificacion (JSON)"
                          hideDownload={true}
                        />
                      </div>
                    )}
                    
                    {proofResult.warning && (
                      <p style={{ marginTop: '10px', color: '#000', fontSize: '12px' }}>
                        {proofResult.warning}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ color: '#000' }}>Error: {proofResult.error}</p>
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
