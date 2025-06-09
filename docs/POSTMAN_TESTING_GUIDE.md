# 🚀 Guía Completa para Probar LisaDocs Backend con Postman

¡Hola Jonathan! 👋 Esta guía te ayudará a probar completamente tu backend de LisaDocs usando Postman con la configuración actual.

## 📋 Configuración Inicial

### 🔧 1. Iniciar el Backend

Primero, asegúrate de tener el backend ejecutándose:

```bash
# En la carpeta backend/
cd backend

# Instalar dependencias (si no lo has hecho)
pnpm install

# Generar el cliente Prisma
pnpm db:generate

# Aplicar cambios a la base de datos
pnpm db:push

# Sembrar datos iniciales (crear usuario admin)
pnpm db:seed

# Iniciar el servidor en modo desarrollo
pnpm dev
```

**✅ Confirmación:** El servidor debería estar ejecutándose en `http://localhost:8080`

### 🗄️ 2. Datos de Prueba Disponibles

Según tu `seed.ts`, tienes estos datos para pruebas:

```json
{
  "email": "admin@lisadocs.gob.cu",
  "password": "Admin123!",
  "role": "administrador",
  "workspace": "presidencia",
  "fullName": "Administrador del Sistema"
}
```

---

## 🎯 Configuración de Postman

### 📁 Crear una Nueva Colección

1. **Abre Postman**
2. **Clic en "New Collection"**
3. **Nombre:** `LisaDocs API Tests`
4. **Descripción:** `Testing del backend LisaDocs - Puerto 8080`

### 🌐 Variables de Entorno

Crea un **Environment** llamado `LisaDocs Local` con estas variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:8080/api` | `http://localhost:8080/api` |
| `accessToken` | *(vacío)* | *(vacío)* |
| `refreshToken` | *(vacío)* | *(vacío)* |
| `adminEmail` | `admin@lisadocs.gob.cu` | `admin@lisadocs.gob.cu` |
| `adminPassword` | `Admin123!` | `Admin123!` |

---

## 🔐 Pruebas de Autenticación

### 🚀 1. Login - Obtener Tokens

**Request:**

- **Método:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:**

  ```
  Content-Type: application/json
  ```

- **Body (raw JSON):**

  ```json
  {
    "email": "{{adminEmail}}",
    "password": "{{adminPassword}}"
  }
  ```

**Tests Script (Pestaña Tests):**

```javascript
// 🧪 Automatizar captura de tokens
pm.test("Login exitoso", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    
    // Guardar tokens en variables de entorno
    pm.environment.set("accessToken", response.data.accessToken);
    pm.environment.set("refreshToken", response.data.refreshToken);
    
    console.log("🎉 Tokens guardados automáticamente!");
});

pm.test("Response contiene tokens", function () {
    const response = pm.response.json();
    pm.expect(response.data).to.have.property('accessToken');
    pm.expect(response.data).to.have.property('refreshToken');
});
```

**✅ Respuesta Esperada:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-aqui",
      "email": "admin@lisadocs.gob.cu",
      "fullName": "Administrador del Sistema",
      "role": "administrador",
      "workspace": "presidencia"
    }
  }
}
```

### 👤 2. Perfil de Usuario

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/auth/profile`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

### 🔄 3. Refresh Token

**Request:**

- **Método:** `POST`
- **URL:** `{{baseUrl}}/auth/refresh`
- **Body (raw JSON):**

  ```json
  {
    "refreshToken": "{{refreshToken}}"
  }
  ```

---

## 👥 Pruebas de Usuarios

### 📝 1. Crear Usuario

**Request:**

- **Método:** `POST`
- **URL:** `{{baseUrl}}/users`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
  ```

- **Body (raw JSON):**

  ```json
  {
    "email": "secretario@cam.gob.cu",
    "fullName": "Secretario CAM",
    "role": "secretario_cam",
    "workspace": "cam",
    "password": "Secretario123!"
  }
  ```

### 📋 2. Listar Usuarios

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/users`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

### 🔍 3. Obtener Usuario por ID

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/users/{userId}`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

---

## 📄 Pruebas de Documentos

### 📤 1. Upload de Documento

**Request:**

- **Método:** `POST`
- **URL:** `{{baseUrl}}/documents/upload`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

- **Body (form-data):**

  | Key | Type | Value |
  |-----|------|-------|
  | `file` | File | *(seleccionar un PDF)* |
  | `metadata` | Text | `{"title": "Documento de Prueba", "description": "Prueba desde Postman", "tags": ["test", "postman"]}` |

### 📋 2. Listar Documentos

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/documents`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

**Query Parameters:**

| Parameter | Value |
|-----------|-------|
| `page` | `1` |
| `limit` | `10` |
| `workspace` | `presidencia` |

### 📥 3. Descargar Documento

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/documents/{documentId}/download`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

---

## 🔔 Pruebas de Notificaciones

### 📋 1. Listar Notificaciones

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/notifications`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

### ✅ 2. Marcar como Leída

**Request:**

- **Método:** `PUT`
- **URL:** `{{baseUrl}}/notifications/{notificationId}/read`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

---

## 🏢 Pruebas de Workspaces

### 📋 1. Listar Workspaces

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/workspaces`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

### 📊 2. Estadísticas de Workspace

**Request:**

- **Método:** `GET`
- **URL:** `{{baseUrl}}/workspaces/{workspaceName}/stats`
- **Headers:**

  ```
  Authorization: Bearer {{accessToken}}
  ```

---

## 🔧 Configuración Avanzada de Postman

### 🤖 Pre-request Scripts Globales

En la **colección**, ve a **Pre-request Script** y agrega:

```javascript
// 🔄 Auto-refresh de token si está expirado
const accessToken = pm.environment.get("accessToken");
const refreshToken = pm.environment.get("refreshToken");

if (accessToken && refreshToken) {
    // Verificar si el token está próximo a expirar
    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;
        
        // Si expira en menos de 5 minutos, renovar
        if (timeUntilExpiry < 300) {
            console.log("🔄 Token próximo a expirar, renovando...");
            
            pm.sendRequest({
                url: pm.environment.get("baseUrl") + "/auth/refresh",
                method: 'POST',
                header: {
                    'Content-Type': 'application/json'
                },
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        refreshToken: refreshToken
                    })
                }
            }, function (err, response) {
                if (!err && response.code === 200) {
                    const newToken = response.json().data.accessToken;
                    pm.environment.set("accessToken", newToken);
                    console.log("✅ Token renovado automáticamente");
                }
            });
        }
    } catch (e) {
        console.log("⚠️ Error al verificar token:", e.message);
    }
}
```

### 📊 Tests de Validación Comunes

Agrega este script en **Tests** de la colección:

```javascript
// 🧪 Tests comunes para todas las requests

// Verificar que el servidor responda
pm.test("Servidor responde", function () {
    pm.response.to.not.be.undefined;
});

// Verificar tiempo de respuesta
pm.test("Tiempo de respuesta < 2s", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Verificar headers de seguridad (si existen)
pm.test("Headers de seguridad", function () {
    pm.response.to.have.header("X-Frame-Options");
});

// Log de errores para debugging
if (pm.response.code >= 400) {
    console.log("❌ Error Response:", pm.response.json());
}
```

---

## 🚨 Solución de Problemas Comunes

### ❌ Error de Conexión

```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Solución:** Verificar que el backend esté ejecutándose con `pnpm dev`

### 🔐 Error 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token no válido"
}
```

**Solución:**

1. Hacer login nuevamente para obtener tokens frescos
2. Verificar que el token esté en la variable `accessToken`

### 📁 Error 404 en rutas

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Route not found"
}
```

**Solución:** Verificar que la URL base sea `http://localhost:8080/api`

### 🗄️ Error de Base de Datos

```json
{
  "statusCode": 500,
  "error": "Internal Server Error"
}
```

**Solución:**

1. Verificar que PostgreSQL esté ejecutándose
2. Ejecutar `pnpm db:push` para sincronizar el schema
3. Ejecutar `pnpm db:seed` para datos iniciales

---

## 🎯 Casos de Prueba Recomendados

### ✅ Flujo Completo de Pruebas

1. **🔐 Autenticación**
   - Login con credenciales válidas
   - Login con credenciales inválidas
   - Obtener perfil con token válido
   - Refresh token

2. **👥 Gestión de Usuarios**
   - Crear usuario como admin
   - Listar usuarios
   - Actualizar usuario
   - Activar/desactivar usuario

3. **📄 Gestión de Documentos**
   - Subir documento PDF
   - Listar documentos del workspace
   - Descargar documento
   - Archivar documento

4. **🏢 Workspaces y Permisos**
   - Listar workspaces accesibles
   - Verificar permisos por role
   - Estadísticas de workspace

5. **🔔 Notificaciones**
   - Listar notificaciones
   - Marcar como leídas
   - Crear notificación (admin)

---

## 🚀 ¡Listo para Probar

¡Ya tienes todo configurado! 🎉

**Orden recomendado de pruebas:**

1. ✅ Login para obtener tokens
2. ✅ Verificar perfil de usuario
3. ✅ Probar endpoints de usuarios
4. ✅ Probar upload y gestión de documentos
5. ✅ Verificar notificaciones y workspaces

**💡 Tip:** Guarda tu colección de Postman como backup para futuras pruebas.

¡Cualquier error que encuentres, compártelo conmigo y te ayudo a solucionarlo! 🛠️✨
