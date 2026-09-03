// ==============================================================================
// SNEAKER WORLD MLS CALI - STATE & STORAGE MANAGER (BASTION AI)
// Modo Claro Luxury + Rojo Torino + Protección de Costos Mayoristas & Supabase Ready
// ==============================================================================

const DB_KEYS = {
  MASTER_PRODUCTS: "sneakerworld_master_products_v8",
  STORES: "sneakerworld_stores_v8",
  CURRENT_STORE_ID: "sneakerworld_current_store_id_v8",
  ORDERS: "sneakerworld_orders_v8",
  AUTH_SESSION: "sneakerworld_auth_session_v8",
  LINE_ROTATION_INDEX: "sneakerworld_line_rotation_v8",
  ACCOUNTS: "sneakerworld_accounts_v8",
  STOCK: "sneakerworld_inventory_stock_v8"
};

class ShoesStoreManager {
  constructor() {
    this.activeLineIndex = 0;
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.MASTER_PRODUCTS)) {
      localStorage.setItem(DB_KEYS.MASTER_PRODUCTS, JSON.stringify(INITIAL_MASTER_PRODUCTS));
    }
    if (!localStorage.getItem(DB_KEYS.STORES)) {
      localStorage.setItem(DB_KEYS.STORES, JSON.stringify(INITIAL_STORES));
    }
    if (!localStorage.getItem(DB_KEYS.ORDERS)) {
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(DB_KEYS.CURRENT_STORE_ID)) {
      localStorage.setItem(DB_KEYS.CURRENT_STORE_ID, "store-001");
    }
    if (!localStorage.getItem(DB_KEYS.ACCOUNTS)) {
      localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(DEMO_ACCOUNTS));
    }
  }

  // Restablecer a datos de fábrica
  resetToDefaults() {
    localStorage.setItem(DB_KEYS.MASTER_PRODUCTS, JSON.stringify(INITIAL_MASTER_PRODUCTS));
    localStorage.setItem(DB_KEYS.STORES, JSON.stringify(INITIAL_STORES));
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(DB_KEYS.CURRENT_STORE_ID, "store-001");
    localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(DEMO_ACCOUNTS));
    localStorage.removeItem(DB_KEYS.AUTH_SESSION);
    localStorage.removeItem(DB_KEYS.LINE_ROTATION_INDEX);
  }

  // =========================================================================
  // SISTEMA DE AUTENTICACIÓN & GESTIÓN DE CUENTAS (CRM BASTION / GHOST)
  // =========================================================================
  getAccounts() {
    try {
      const raw = localStorage.getItem(DB_KEYS.ACCOUNTS);
      return raw ? JSON.parse(raw) : DEMO_ACCOUNTS;
    } catch (e) {
      return DEMO_ACCOUNTS;
    }
  }

  saveAccounts(accounts) {
    localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  getAuthSession() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.AUTH_SESSION)) || { role: "public", authenticated: false };
    } catch (e) {
      return { role: "public", authenticated: false };
    }
  }

  // Login Unificado con Correo + Contraseña o PIN de Seguridad
  loginWithCredentials(loginInput, passwordOrPin) {
    const cleanInput = (loginInput || "").trim().toLowerCase();
    const cleanPass = (passwordOrPin || "").trim();
    const accounts = this.getAccounts();

    // 1. Verificación de Llave Maestra Super-Admin SaaS (GHOST / Bastion CRM)
    if (
      (cleanInput === SUPER_ADMIN_CONFIG.masterEmail.toLowerCase() || cleanInput === SUPER_ADMIN_CONFIG.masterUsername) &&
      (cleanPass === SUPER_ADMIN_CONFIG.masterKey || cleanPass === SUPER_ADMIN_CONFIG.recoveryPin)
    ) {
      const session = {
        role: "super-admin",
        authenticated: true,
        user: {
          name: "Super-Admin Bastion AI (Owner)",
          email: SUPER_ADMIN_CONFIG.masterEmail,
          isSuperAdmin: true
        },
        timestamp: Date.now()
      };
      localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify(session));
      return { success: true, isSuperAdmin: true, session };
    }

    // 2. Verificación de Cuentas Demo de Clientes (Vanessa o Cali Shoes)
    for (const key in accounts) {
      const acc = accounts[key];
      const matchIdentifier = (
        cleanInput === acc.email.toLowerCase() ||
        cleanInput === acc.username.toLowerCase() ||
        cleanInput === acc.phone ||
        cleanInput === key
      );

      const matchPassword = (
        cleanPass === acc.password ||
        cleanPass === acc.pin ||
        cleanPass === "Calishoes2026" || // Contraseña por defecto
        cleanPass === SUPER_ADMIN_CONFIG.masterKey || // Master Override de Soporte
        cleanPass === SUPER_ADMIN_CONFIG.recoveryPin
      );

      if (matchIdentifier && matchPassword) {
        const session = {
          role: acc.role,
          authenticated: true,
          accountKey: key,
          user: acc,
          tenantId: acc.tenantId,
          storeId: acc.storeId,
          timestamp: Date.now()
        };
        localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify(session));
        localStorage.setItem(DB_KEYS.CURRENT_STORE_ID, acc.storeId);
        return { success: true, account: acc, session };
      }
    }

    // 3. Fallback PINs numéricos rápidos
    if (cleanPass === "8820" || cleanPass === "1234") {
      const role = cleanPass === "8820" ? "supplier" : "store-admin";
      const targetAcc = cleanPass === "8820" ? accounts.vanessa : accounts.calishoes;
      const session = {
        role,
        authenticated: true,
        user: targetAcc,
        timestamp: Date.now()
      };
      localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify(session));
      return { success: true, account: targetAcc, session };
    }

    return {
      success: false,
      message: "Credenciales no válidas. Prueba correo: vanessa@castellarshoes.com y contraseña: Calishoes2026"
    };
  }

  // Compatibilidad con modal rápido de PIN
  authenticate(role, pin) {
    if (pin === "Calishoes2026" || pin === "8820" || pin === "1234" || pin === SUPER_ADMIN_CONFIG.masterKey || pin === "9999") {
      const session = { role, authenticated: true, timestamp: Date.now() };
      localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify(session));
      return { success: true };
    }
    return { success: false, message: "PIN de seguridad o contraseña incorrecta." };
  }

  // Cambio de Credenciales y Seguridad de Cuenta en Privado
  updateAccountSecurity(accountKey, { name, email, password, pin, phone }) {
    const accounts = this.getAccounts();
    if (!accounts[accountKey]) return { success: false, message: "Cuenta no encontrada." };

    if (name) accounts[accountKey].name = name;
    if (email) accounts[accountKey].email = email;
    if (password) accounts[accountKey].password = password;
    if (pin) accounts[accountKey].pin = pin;
    if (phone) accounts[accountKey].phone = phone;

    this.saveAccounts(accounts);

    // Actualizar sesión activa
    const session = this.getAuthSession();
    if (session && session.user) {
      session.user = { ...session.user, ...accounts[accountKey] };
      localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify(session));
    }

    return { success: true, account: accounts[accountKey] };
  }

  // Reseteo de Emergencia por el Dueño del SaaS (GHOST / Bastion AI)
  superAdminResetPassword(accountKey, newPassword = "Calishoes2026") {
    const accounts = this.getAccounts();
    if (accounts[accountKey]) {
      accounts[accountKey].password = newPassword;
      accounts[accountKey].pin = (accountKey === "vanessa") ? "8820" : "1234";
      this.saveAccounts(accounts);
      return { success: true, message: `Contraseña de ${accounts[accountKey].name} restablecida a '${newPassword}'` };
    }
    return { success: false, message: "Cuenta no encontrada." };
  }

  // Descargar Copia de Respaldo de Seguridad JSON (Data Loss Prevention)
  exportBackupData() {
    const backup = {
      timestamp: new Date().toISOString(),
      platform: "SNEAKER WORLD MLS CALI",
      author: "Bastion AI / GHOST CRM",
      accounts: this.getAccounts(),
      stores: this.getStores(),
      products: this.getMasterProducts(true),
      orders: this.getOrders()
    };
    return JSON.stringify(backup, null, 2);
  }

  logout() {
    localStorage.setItem(DB_KEYS.AUTH_SESSION, JSON.stringify({ role: "public", authenticated: false }));
  }

  // =========================================================================
  // GESTIÓN DE PRODUCTOS Y MÁSCARA PÚBLICA
  // =========================================================================
  getMasterProducts(requireAuth = false) {
    const raw = localStorage.getItem(DB_KEYS.MASTER_PRODUCTS);
    const products = raw ? JSON.parse(raw) : INITIAL_MASTER_PRODUCTS;

    // Si es público y requiere confidencialidad, se eliminan los costos mayoristas
    if (!requireAuth) {
      return products;
    }

    const session = this.getAuthSession();
    if (!session.authenticated && session.role !== "supplier") {
      // Ocultar costos mayoristas
      return products.map(p => {
        const { wholesalePrice, ...safeData } = p;
        return safeData;
      });
    }

    return products;
  }

  addMasterProduct(productData) {
    const products = this.getMasterProducts(false);
    const newProduct = {
      id: "prod-snk-" + Date.now(),
      sku: productData.sku || "NK-" + Math.floor(1000 + Math.random() * 9000),
      name: productData.name,
      category: productData.category || "Running & Tech",
      tagline: productData.tagline || "Silueta deportiva premium importada.",
      description: productData.description || "",
      image: productData.image || "assets/images/nike_initiator_babyblue.jpg",
      wholesalePrice: Number(productData.wholesalePrice) || 120000,
      suggestedRetailPrice: Number(productData.suggestedRetailPrice) || 195000,
      sizes: productData.sizes || [37, 38, 39, 40, 41, 42],
      colorways: productData.colorways && productData.colorways.length > 0 
        ? productData.colorways 
        : [{ name: "Tono Principal", image: productData.image || "assets/images/nike_initiator_babyblue.jpg", sku: productData.sku || "NK-01" }],
      supplierId: "sup-001",
      supplierName: "Vanessa Castellar Shoes (Bodega Central)",
      createdAt: new Date().toISOString().split("T")[0]
    };
    products.unshift(newProduct);
    localStorage.setItem(DB_KEYS.MASTER_PRODUCTS, JSON.stringify(products));

    // Agregar automáticamente a todas las tiendas de la red
    const stores = this.getStores();
    stores.forEach(st => {
      st.products.unshift({
        productId: newProduct.id,
        customPrice: newProduct.suggestedRetailPrice,
        active: true,
        availableSizes: [...newProduct.sizes]
      });
    });
    localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));

    return newProduct;
  }

  updateMasterProduct(productId, updatedFields) {
    const products = this.getMasterProducts(false);
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updatedFields,
      wholesalePrice: updatedFields.wholesalePrice !== undefined ? Number(updatedFields.wholesalePrice) : products[index].wholesalePrice,
      suggestedRetailPrice: updatedFields.suggestedRetailPrice !== undefined ? Number(updatedFields.suggestedRetailPrice) : products[index].suggestedRetailPrice,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    localStorage.setItem(DB_KEYS.MASTER_PRODUCTS, JSON.stringify(products));

    // Sincronizar badges de campaña o tallas en las tiendas asociadas
    const stores = this.getStores();
    stores.forEach(st => {
      const pIdx = st.products.findIndex(sp => sp.productId === productId);
      if (pIdx !== -1) {
        if (updatedFields.campaignBadge !== undefined) {
          st.products[pIdx].campaignBadge = updatedFields.campaignBadge;
        }
        if (updatedFields.sizes) {
          st.products[pIdx].availableSizes = [...updatedFields.sizes];
        }
      }
    });
    localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));

    return products[index];
  }

  // =========================================================================
  // GESTIÓN DE TIENDAS Y VITRINAS
  // =========================================================================
  getStores() {
    const raw = localStorage.getItem(DB_KEYS.STORES);
    return raw ? JSON.parse(raw) : INITIAL_STORES;
  }

  getCurrentStoreId() {
    return localStorage.getItem(DB_KEYS.CURRENT_STORE_ID) || "store-001";
  }

  setCurrentStoreId(storeId) {
    localStorage.setItem(DB_KEYS.CURRENT_STORE_ID, storeId);
  }

  getCurrentStore() {
    const stores = this.getStores();
    const id = this.getCurrentStoreId();
    return stores.find(s => s.id === id) || stores[0];
  }

  updateStoreProductPrice(storeId, productId, newPrice) {
    const stores = this.getStores();
    const store = stores.find(s => s.id === storeId);
    if (store) {
      let p = store.products.find(item => item.productId === productId);
      if (!p) {
        const master = this.getMasterProducts(false);
        const mp = master.find(m => m.id === productId);
        p = {
          productId,
          customPrice: Number(newPrice),
          active: true,
          availableSizes: mp ? [...mp.sizes] : [37, 38, 39, 40, 41, 42]
        };
        store.products.push(p);
      } else {
        p.customPrice = Number(newPrice);
      }
      localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));
    }
  }

  toggleStoreProductActive(storeId, productId) {
    const stores = this.getStores();
    const store = stores.find(s => s.id === storeId);
    if (store) {
      let p = store.products.find(item => item.productId === productId);
      if (!p) {
        const master = this.getMasterProducts(false);
        const mp = master.find(m => m.id === productId);
        p = {
          productId,
          customPrice: mp ? mp.suggestedRetailPrice : 185000,
          active: false,
          availableSizes: mp ? [...mp.sizes] : [37, 38, 39, 40, 41, 42]
        };
        store.products.push(p);
      } else {
        p.active = !p.active;
      }
      localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));
      return p.active;
    }
    return false;
  }

  toggleStoreSize(storeId, productId, size) {
    const stores = this.getStores();
    const store = stores.find(s => s.id === storeId);
    if (store) {
      let p = store.products.find(item => item.productId === productId);
      const master = this.getMasterProducts(false);
      const mp = master.find(m => m.id === productId);

      if (!p) {
        p = {
          productId,
          customPrice: mp ? mp.suggestedRetailPrice : 185000,
          active: true,
          availableSizes: mp ? [...mp.sizes] : [37, 38, 39, 40, 41, 42]
        };
        store.products.push(p);
      }

      if (!p.availableSizes) {
        p.availableSizes = mp ? [...mp.sizes] : [37, 38, 39, 40, 41, 42];
      }

      const numSize = Number(size);
      if (p.availableSizes.includes(numSize)) {
        p.availableSizes = p.availableSizes.filter(s => s !== numSize);
      } else {
        p.availableSizes.push(numSize);
        p.availableSizes.sort((a, b) => a - b);
      }

      localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));
      return p.availableSizes.includes(numSize);
    }
    return false;
  }

  getStorefrontProducts(store) {
    const master = this.getMasterProducts(false);
    return master
      .filter(mp => {
        const sp = (store.products || []).find(p => p.productId === mp.id);
        if (store.isSupplierStore) {
          return !sp || sp.active !== false;
        }
        return sp && sp.active !== false && sp.availableSizes && sp.availableSizes.length > 0;
      })
      .map(mp => {
        const sp = (store.products || []).find(p => p.productId === mp.id);
        const { wholesalePrice, ...safeMp } = mp;
        return {
          ...safeMp,
          storeRetailPrice: (sp && sp.customPrice) ? sp.customPrice : mp.suggestedRetailPrice,
          storeAvailableSizes: (sp && sp.availableSizes) ? sp.availableSizes : mp.sizes
        };
      });
  }

  // =========================================================================
  // GESTIÓN DE PEDIDOS Y FLETES
  // =========================================================================
  getOrders() {
    const raw = localStorage.getItem(DB_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  }

  addB2BOrder(orderData) {
    const orders = this.getOrders();
    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newOrder = {
      id: "ord-" + Math.floor(1000 + Math.random() * 9000),
      date: dateStr,
      storeName: orderData.storeName,
      productName: orderData.productName,
      size: orderData.size,
      colorway: orderData.colorway || "Estándar",
      type: "B2B Restock (Reposición)",
      units: Number(orderData.units) || 1,
      totalWholesale: Number(orderData.totalWholesale) || 0,
      status: "En Alistamiento",
      supplierName: orderData.supplierName || "Vanessa Castellar Shoes (Bodega Central)"
    };
    orders.unshift(newOrder);
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  getSizeCm(size) {
    const sizeMap = {
      35: "22.5 cm",
      36: "23.0 cm",
      37: "23.8 cm",
      38: "24.5 cm",
      39: "25.0 cm",
      40: "25.8 cm",
      41: "26.5 cm",
      42: "27.2 cm",
      43: "28.0 cm",
      44: "28.8 cm"
    };
    return sizeMap[size] || "24.5 cm";
  }

  // =========================================================================
  // BALANCEADOR INTELIGENTE ROUND-ROBIN (10 LÍNEAS DE WHATSAPP)
  // =========================================================================
  getNextWhatsAppLine(store) {
    const targetStore = store || this.getCurrentStore();
    if (!targetStore || !targetStore.whatsappLines || targetStore.whatsappLines.length === 0) {
      const fallbackPhone = (targetStore && targetStore.phone) ? targetStore.phone : "573505337256";
      return { phone: fallbackPhone, name: "Línea Central" };
    }

    const lines = targetStore.whatsappLines.filter(l => l.active !== false);
    if (lines.length === 0) {
      return targetStore.whatsappLines[0] || { phone: "573505337256", name: "Línea Central" };
    }

    let currentIndex = parseInt(localStorage.getItem(DB_KEYS.LINE_ROTATION_INDEX) || "0", 10);
    const line = lines[currentIndex % lines.length];
    
    // Rotar para el próximo cliente
    localStorage.setItem(DB_KEYS.LINE_ROTATION_INDEX, (currentIndex + 1) % lines.length);
    return line;
  }

  // Generador de Mensaje de WhatsApp para 1 solo Par
  buildSingleProductWhatsAppUrl(store, product, colorway, size) {
    const assignedLine = this.getNextWhatsAppLine(store);
    const phone = assignedLine.phone || assignedLine || "573505337256";
    const formattedPrice = this.formatCOP(product.storeRetailPrice || product.suggestedRetailPrice);
    const colorName = colorway ? colorway.name : "Color Principal";
    const cm = this.getSizeCm(size);

    const text = `👋 *¡Hola ${store.name}!* Vi este modelo en su vitrina digital y quiero apartarlo:

👟 *MODELO:* ${product.name}
🔖 *SKU:* ${product.sku}
🎨 *COLOR:* ${colorName}
📏 *TALLA:* ${size} (Plantilla: ${cm})
💰 *PRECIO:* ${formattedPrice}

📍 *Destino en Cali:* (Indicar Barrio / Comuna)
🛵 *Modalidad:* Despacho Hoy Contraentrega / Asegurado

¿Me confirman disponibilidad inmediata para despacho hoy? ¡Muchas gracias! ✨`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  // Generador de Mensaje de WhatsApp para Carrito Multi-Par Consolidado
  buildConsolidatedCartWhatsAppUrl(store, cartItems, clientData, shippingZone, dispatchMode) {
    const assignedLine = this.getNextWhatsAppLine(store);
    const phone = assignedLine.phone || assignedLine || "573505337256";
    const totalShoesPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingFee = shippingZone ? shippingZone.fee : 10000;
    const grandTotal = totalShoesPrice + shippingFee;
    const refCode = "SW-" + Math.floor(1000 + Math.random() * 9000);

    const itemsSummary = cartItems.map((item, i) => {
      const cm = this.getSizeCm(item.size);
      return `${i + 1}. 👟 *${item.name}*
   • Talla: ${item.size} (${cm}) | Color: ${item.colorway}
   • Cant: ${item.quantity} par(es) | Subtotal: ${this.formatCOP(item.price * item.quantity)}`;
    }).join("\n\n");

    const dispatchText = dispatchMode === "secured" 
      ? `🛡️ *Despacho Asegurado* (Abono de flete ${this.formatCOP(shippingFee)} por Nequi/Daviplata + saldo en efectivo al recibir)`
      : `🛵 *100% Contraentrega al Recibir* (Pago total en puerta al motorizado)`;

    const text = `🛍️ *¡NUEVO PEDIDO CONSOLIDADO SNEAKER WORLD MLS!*
*Comanda:* #${refCode}
*Tienda:* ${store.name}

👤 *DATOS DE ENTREGA:*
• *Cliente:* ${clientData.name || 'Cliente'}
• *WhatsApp:* ${clientData.phone || 'El mismo'}
• *Barrio / Zona:* ${shippingZone ? shippingZone.name : 'Cali'}
• *Dirección:* ${clientData.address || 'Pendiente por confirmar'}

📦 *DETALLE DE CALZADO (${cartItems.length} ref / ${cartItems.reduce((a, b) => a + b.quantity, 0)} pares):*
${itemsSummary}

💵 *LIQUIDACIÓN DEL PEDIDO:*
• Calzado: ${this.formatCOP(totalShoesPrice)}
• Domicilio Motorizado: ${this.formatCOP(shippingFee)} (${shippingZone ? shippingZone.time : 'Hoy mismo'})
👉 *GRAN TOTAL A COBRAR: ${this.formatCOP(grandTotal)}*

🚚 *MODALIDAD:*
${dispatchText}

⚡ *Reserva de bodega activa (20 min):* Por favor confirmar disponibilidad para preparar en bodega de San Andresito Cali. ¡Gracias! ✨`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  // =========================================================================
  // CONTROL DE STOCK EN TIEMPO REAL (POR COLOR Y TALLA)
  // =========================================================================
  getStockData() {
    const raw = localStorage.getItem(DB_KEYS.STOCK);
    return raw ? JSON.parse(raw) : {};
  }

  saveStockData(stockData) {
    localStorage.setItem(DB_KEYS.STOCK, JSON.stringify(stockData));
  }

  getProductStockMatrix(productId) {
    const stockData = this.getStockData();
    const master = this.getMasterProducts(false);
    const prod = master.find(p => p.id === productId);
    if (!prod) return {};

    if (!stockData[productId]) {
      stockData[productId] = {};
      const colorways = prod.colorways && prod.colorways.length > 0 ? prod.colorways : [{ name: "Estándar" }];
      const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : [36, 37, 38, 39, 40, 41, 42];

      colorways.forEach(cw => {
        sizes.forEach(sz => {
          const key = `${cw.name}_${sz}`;
          stockData[productId][key] = Math.floor(4 + (parseInt(sz, 10) % 5));
        });
      });

      this.saveStockData(stockData);
    }

    return stockData[productId];
  }

  getProductStock(productId, colorwayName, size) {
    const matrix = this.getProductStockMatrix(productId);
    const colorKey = colorwayName || "Estándar";
    const key = `${colorKey}_${size}`;
    
    if (matrix[key] !== undefined) {
      return Number(matrix[key]);
    }

    const sizeKeys = Object.keys(matrix).filter(k => k.endsWith(`_${size}`));
    if (sizeKeys.length > 0) {
      return Number(matrix[sizeKeys[0]]) || 0;
    }

    return 5;
  }

  getProductTotalStock(productId) {
    const matrix = this.getProductStockMatrix(productId);
    return Object.values(matrix).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
  }

  updateProductStockCell(productId, colorwayName, size, newQty) {
    const stockData = this.getStockData();
    const currentMatrix = this.getProductStockMatrix(productId);
    const key = `${colorwayName}_${size}`;
    currentMatrix[key] = Math.max(0, parseInt(newQty, 10) || 0);
    stockData[productId] = currentMatrix;
    this.saveStockData(stockData);
    return currentMatrix[key];
  }

  saveProductStockMatrix(productId, newMatrix) {
    const stockData = this.getStockData();
    stockData[productId] = newMatrix;
    this.saveStockData(stockData);
  }

  decrementStock(productId, colorwayName, size, count = 1) {
    const stockData = this.getStockData();
    const currentMatrix = this.getProductStockMatrix(productId);
    const colorKey = colorwayName || "Estándar";
    let key = `${colorKey}_${size}`;

    if (currentMatrix[key] === undefined) {
      const fallbackKey = Object.keys(currentMatrix).find(k => k.endsWith(`_${size}`));
      if (fallbackKey) key = fallbackKey;
    }

    const currentQty = currentMatrix[key] !== undefined ? Number(currentMatrix[key]) : 5;
    const newQty = Math.max(0, currentQty - Number(count));
    currentMatrix[key] = newQty;
    stockData[productId] = currentMatrix;
    this.saveStockData(stockData);

    return {
      productId,
      colorway: colorKey,
      size,
      remaining: newQty,
      isSoldOut: newQty <= 0
    };
  }
}

// Instancia global del manejador
const db = new ShoesStoreManager();
