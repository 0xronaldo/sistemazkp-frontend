# SistemaZKP - AI Development Guide

## Architecture Overview

This is a **Zero Knowledge Proof (ZKP) identity system** with two main components:
- **Frontend** (`sistemazkp/`): React SPA with wallet integration and traditional auth
- **Backend** (`backend_zkp/`): Express.js API server acting as proxy to issuer node

### Key Integration Points

- Backend runs on port **5000** (configurable via `process.env.PORT`)
- External **Issuer Node** expected on `localhost:3001` for DID operations
- MetaMask wallet integration for Web3 authentication
- No database layer - relies on external issuer node for identity management

## Development Workflow

### Starting the System
```bash
# Frontend (port 3000)
cd sistemazkp && npm start

# Backend (port 5000) 
cd backend_zkp && npm run dev  # Uses nodemon for hot reload
```

### Testing DID Creation
```bash
curl -X POST http://localhost:3001/v2/identities \
-H "Content-Type: application/json" \
-d '{"userData": {"name": "Test", "email": "test@example.com", "state": "activo"}}'
```

### Testing Registration Flow
```bash
curl -X POST http://localhost:5000/api/register \
-H "Content-Type: application/json" \
-d '{"name": "Test User", "email": "test@example.com", "password": "test123"}'
```

## Code Patterns & Conventions

### React Component Structure
- **Single-file components** in `App.js` (LoginScreen, RegisterScreen, DashboardScreen)
- **View-based state management** using `currentView` enum: `'login' | 'register' | 'dashboard'`
- **Dual authentication paths**: traditional email/password + MetaMask wallet
- User object shape: `{ name, email, type: 'normal' | 'wallet' | 'zkp', address?, did?, zkpData? }`

### Backend Proxy Pattern
```javascript
// Standard pattern for issuer node communication
const response = await axios.post(`${ISSUER_NODE_BASE_URL}/v2/identities`, req.body);
res.json(response.data);
```

### Frontend API Integration
```javascript
// All API calls use fetch with backend URL
const BACKEND_URL = 'http://localhost:5000';
const response = await fetch(`${BACKEND_URL}/api/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password })
});
```

### Data Flow Architecture

#### Two-Phase Identity System
1. **Phase 1 - DID Creation (Identity)**
   - Frontend sends registration data → `/api/register`
   - Backend transforms data using `userToIdentitySchema()` from `scheme.js`
   - Backend forwards to issuer node at `localhost:3001/v2/identities`
   - Issuer Node creates DID and returns identity data

2. **Phase 2 - Credential Issuance (VC)**
   - Backend generates Verifiable Credential using `createUserAuthCredential()`
   - VC is W3C-compliant with Polygon ID schema
   - Response includes both DID and VC for ZKP operations

3. **Frontend Receives**
   - DID (decentralized identifier)
   - User data with zkpData
   - Verifiable Credential for future proofs
   - Displays in dashboard with ZKP info boxes

### Schema Architecture

**Two Schema Types Required**:
- **JSON Schema** (`.json`): Defines structure and validation rules
- **JSON-LD Context** (`.jsonld`): Defines semantic context for interoperability

**Schema Functions**:
- `userToIdentitySchema()` - Transforms user data to Polygon ID format for DID creation
- `walletToIdentitySchema()` - Transforms wallet address to identity format
- `createUserAuthCredential()` - Generates W3C VC for email/password auth
- `createWalletAuthCredential()` - Generates W3C VC for wallet auth
- `didFromEthAddress()` - Generates DID from Ethereum address (testnet/mainnet)
- `formatResponseForFrontend()` - Packages DID + ZKP data + VC for client

### Wallet Authentication Flow
```javascript
// Frontend connects wallet
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

// Backend generates DID from address
const did = didFromEthAddress(walletAddress, 'testnet');

// Creates wallet-specific VC
const credential = createWalletAuthCredential(did, walletAddress, userData);
```

### CSS Organization
- Component styles in `login.css` (handles all auth + dashboard styles)
- **Gradient backgrounds**: `linear-gradient(135deg, #e4e5df 0%, #e2e3aa 100%)`
- **Card-based layouts** with hover transforms
- **ZKP info boxes** (`.zkp-info`, `.info-box`) for displaying DIDs and credentials
- Mobile-first responsive with `@media (max-width: 768px)`

## Critical Files

- `src/App.js` - Main application with all components and state logic
- `backend_zkp/src/app.js` - Express server setup with routes registered
- `backend_zkp/rutas/routes.js` - API endpoints: `/api/register`, `/api/login`, `/api/wallet-auth`, `/v2/identities`
- `backend_zkp/scheme/scheme.js` - **Core**: Data transformation schemas for DID creation and VC formatting
- `backend_zkp/issure-schemes/` - **Schema definitions**: JSON and JSON-LD files for credentials
  - `UserAuthCredential.json` - Email/password authentication schema
  - `UserAuthCredential.jsonld` - Semantic context for user auth
  - `Basic Person Schema.json` - DIF-compliant person schema (reference)
  - `zk-room-verify-eth-address.json` - Ethereum address verification schema

## API Endpoints

### Frontend-Facing Endpoints
- `POST /api/register` - Register user, create DID, issue VC (email/password)
- `POST /api/wallet-auth` - Authenticate/register with MetaMask wallet
- `POST /api/login` - Authenticate user (mock - needs real DID lookup)
- `GET /health` - Health check endpoint

### Issuer Node Passthrough
- `POST /v2/identities` - Direct DID creation (passthrough to issuer node)
- `POST /v2/identities-auth` - Authenticated DID creation with basic auth

## Schema System Explained

### JSON-LD Context
JSON-LD adds semantic meaning to JSON data. Instead of just `"name": "Juan"`, it defines:
```json
{
  "@context": { "name": "http://schema.org/name" },
  "name": "Juan"
}
```
This makes data universally understandable across systems.

### Why Two Schemas?

1. **DID Schema** (`userToIdentitySchema`): Creates the decentralized identity on Polygon ID
2. **VC Schema** (`createUserAuthCredential`): Issues verifiable credentials associated with that DID

They serve different purposes:
- **DID** = Your identity container
- **VC** = Claims/credentials inside that identity

### Credential Subject Structure
```javascript
{
  id: "did:polygonid:polygon:amoy:2qXYZ...",
  fullName: "Juan Pérez",
  email: "juan@example.com",
  authMethod: "email" | "wallet" | "hybrid",
  accountState: "active" | "suspended" | "pending",
  registrationDate: 1696272000,
  isVerified: false
}
```

## Known Issues & TODOs

- **Login endpoint** is mock - needs integration with issuer node to fetch existing DIDs
- **No credential storage** - DIDs created but not persisted, need DB layer
- **No password hashing** - passwords not verified with bcrypt
- **No wallet signature verification** - should verify signed message
- **No credential revocation** - credentialStatus not implemented
- **Empty components folder** - suggests planned component extraction
- **DID generation uses mock Base64** - should use bs58 library for production

## Development Tips

When extending this codebase:
- Maintain the proxy pattern for issuer node communication
- All data transformations must go through `scheme.js` functions
- Frontend should never directly call issuer node - always proxy through backend
- DID and zkpData should be stored in user state after registration/login
- Use `formatResponseForFrontend()` consistently for all issuer node responses
- Credential schemas in `issure-schemes/` follow Privado ID Common Schemas format
- Always create both `.json` and `.jsonld` files for new credential types
- Test with curl commands before integrating frontend

### Adding New Credential Types
1. Create `YourCredential.json` in `issure-schemes/` (structure + validation)
2. Create `YourCredential.jsonld` (semantic context with `@context`)
3. Add creator function in `scheme.js`: `createYourCredential(did, data)`
4. Add endpoint in `routes.js` to issue the credential
5. Update frontend to display the new credential type

## References
- See `backend_zkp/SCHEMAS-DOCS.md` for comprehensive schema documentation
- Polygon ID docs: https://docs.polygonid.com/
- W3C Verifiable Credentials: https://www.w3.org/TR/vc-data-model/