# Sistema ZKP - Frontend

React SPA para sistema de autenticación descentralizada con Zero Knowledge Proofs (ZKP).

## 🚀 Inicio Rápido

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Arquitectura

### Componentes Principales (todos en `src/App.js`)

- **LoginScreen**: Login con email/password o MetaMask
- **RegisterScreen**: Registro de nuevos usuarios
- **DashboardScreen**: Dashboard con información ZKP

### Estado de la Aplicación

```javascript
{
  currentView: 'login' | 'register' | 'dashboard',
  user: {
    name: string,
    email: string,
    type: 'normal' | 'wallet' | 'zkp',
    address?: string,      // Si es wallet
    did?: string,          // DID de Polygon ID
    zkpData?: object,      // Datos ZKP del issuer
    credential?: object    // Credencial Verificable
  }
}
```

## 🔌 Integración con Backend

### Backend URL
```javascript
const BACKEND_URL = 'http://localhost:5000';
```

### Endpoints Usados

#### 1. Registro
```javascript
POST /api/register
Body: { name, email, password }
Response: { success, did, user, zkpData, credential }
```

#### 2. Login
```javascript
POST /api/login
Body: { email, password }
Response: { success, did, user, zkpData }
```

#### 3. Wallet Auth
```javascript
POST /api/wallet-auth
Body: { walletAddress, name }
Response: { success, did, user, zkpData, credential }
```

## 🎨 Estilos

Todo centralizado en `src/login.css`:

- `.login-container` - Pantallas de auth con gradiente
- `.dashboard` - Layout del dashboard
- `.zkp-info` - Contenedor de información ZKP
- `.info-box` - Cajas de información con DIDs
- Responsive design para móviles

## 🦊 MetaMask Integration

```javascript
// Conectar wallet
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts'
});

// Enviar al backend para crear/obtener DID
const response = await fetch(`${BACKEND_URL}/api/wallet-auth`, {
  method: 'POST',
  body: JSON.stringify({ walletAddress: accounts[0] })
});
```

## 📦 Dependencias

- `react` ^19.1.1
- `react-dom` ^19.1.1
- `react-scripts` 5.0.1

## 🧪 Testing

```bash
npm test        # Tests con Jest
npm run build   # Build de producción
```

## 📁 Estructura

```
src/
├── App.js           # Componentes y lógica principal
├── App.css          # Estilos generales
├── login.css        # Estilos de auth y dashboard
├── index.js         # Entry point
└── components/      # (vacío - pendiente extracción)
```

## 🔐 Flujo de Usuario

### Registro
1. Usuario ingresa nombre, email, password
2. Click en "Crear Cuenta"
3. Frontend → Backend → Issuer Node
4. Recibe DID y credencial verificable
5. Muestra dashboard con información ZKP

### Login con Wallet
1. Usuario click en "Conectar Wallet"
2. MetaMask solicita permisos
3. Frontend envía wallet address al backend
4. Backend genera/obtiene DID
5. Muestra dashboard con DID de wallet

## 📊 Dashboard

Muestra información ZKP cuando disponible:

```jsx
{user.did && (
  <div className="zkp-info">
    <h3>🔐 Tu Identidad ZKP</h3>
    <div className="info-box">
      <p><strong>DID:</strong></p>
      <code>{user.did}</code>
    </div>
    <div className="info-box">
      <p><strong>Estado:</strong> {user.zkpData.state}</p>
      <p><strong>Tipo:</strong> {user.type}</p>
    </div>
  </div>
)}
```

## 🛠️ Configuración

### Backend URL
Cambiar en `App.js` si backend corre en otro puerto:
```javascript
const BACKEND_URL = 'http://localhost:5000';  // Cambiar aquí
```

### MetaMask
Asegúrate de tener MetaMask instalado para autenticación con wallet.

## 📚 Más Información

- **Documentación completa**: Ver `backend_zkp/README.md`
- **Schemas y VCs**: Ver `backend_zkp/SCHEMAS-DOCS.md`
- **JSON-LD explicado**: Ver `backend_zkp/JSON-LD-EXPLAINED.md`
- **Ejemplos**: Ver `backend_zkp/EXAMPLES.md`

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
**Solución**: Verificar que backend esté corriendo en puerto 5000
```bash
cd backend_zkp && npm run dev
```

### Error: "MetaMask no está instalado"
**Solución**: Instalar extension de MetaMask en tu navegador

### Error: "Failed to fetch"
**Solución**: Verificar CORS en backend - debe tener `cors()` habilitado

## 🚀 Deploy

```bash
npm run build    # Genera carpeta build/
# Subir contenido de build/ a hosting (Vercel, Netlify, etc.)
```

## 📝 Notas de Desarrollo

- Todos los componentes están en un solo archivo (`App.js`)
- Pendiente: Extraer a archivos separados en `components/`
- Estado se maneja con hooks de React (`useState`)
- No hay routing - solo cambio de vista con `currentView`

---

**Estado**: ✅ Funcional - Integrado con backend ZKP

Creado con [Create React App](https://github.com/facebook/create-react-app)
