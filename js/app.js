// ==============================================================================
// SNEAKER WORLD MLS CALI - REACTIVE CLIENT APP CONTROLLER (BASTION AI)
// Modo Claro Luxury + Rojo Torino + Auth PIN + 10 Líneas WhatsApp + Carrito Multi-Par
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Estado Reactivo Local
  let currentView = "storefront";
  let activeBrandFilter = "all";
  let activeSizeFilter = "all";
  let searchQuery = "";
  let categoryFilter = "all";
  let sortOrder = "default";
  
  // Carrito de compras Multi-Par
  let cart = [];
  let cartReservationTimer = 20 * 60; // 20 minutos en segundos
  let timerInterval = null;

  // Inicializar UI
  initApp();

  function initApp() {
    // Manejo de parámetros de URL Multi-Tenant (?store=... &view=... &supplier=...)
    const urlParams = new URLSearchParams(window.location.search);
    const paramStore = urlParams.get("store");
    const paramView = urlParams.get("view");
    const paramSupplier = urlParams.get("supplier");
    const paramRole = urlParams.get("role");
    const paramDemo = urlParams.get("demo");

    if (paramStore) {
      db.setCurrentStoreId(paramStore);
    }
    if (paramSupplier) {
      localStorage.setItem("sneakerworld_active_supplier_id", paramSupplier);
    }
    if (paramRole === "super-admin") {
      const current = db.getAuthSession();
      if (!current.authenticated || current.role !== "super-admin") {
        db.loginWithCredentials(SUPER_ADMIN_CONFIG.masterUsername, SUPER_ADMIN_CONFIG.masterKey);
      }
    }

    if (paramView && ["storefront", "store-admin", "supplier", "directory"].includes(paramView)) {
      currentView = paramView;
    }

    renderHudStores();
    setupHeadersAndRoleIsolation(paramDemo);
    setupNavigation();
    setupFilters();
    setupAuthModal();
    setupCartDrawer();
    setupAddProductModal();
    setupRoiCalculator();
    setupAccountSettingsModal();
    switchView(currentView);
  }

  // =========================================================================
  // GESTIÓN DE BARRAS DE NAVEGACIÓN PRIVADAS vs PANEL SUPREMO (ISOLATION)
  // =========================================================================
  function setupHeadersAndRoleIsolation(paramDemo) {
    const session = db.getAuthSession();
    const masterHud = document.getElementById("master-admin-hud");
    const clientHud = document.getElementById("client-auth-hud");
    const isSuperAdmin = session.role === "super-admin" || paramDemo === "true";

    if (masterHud) masterHud.style.display = "none";
    if (clientHud) clientHud.style.display = "none";

    if (isSuperAdmin) {
      // SOLO EL DUEÑO DEL SAAS (GHOST / BASTION AI) VE EL PANEL SUPREMO COMPLETO
      if (masterHud) masterHud.style.display = "block";
    } else if (session.authenticated && (session.role === "supplier" || session.role === "store-admin")) {
      // EL CLIENTE (VANESSA O SNEAKER PARTNER) VE SOLO SU BARRA CORPORATIVA PRIVADA
      if (clientHud) {
        clientHud.style.display = "block";
        const titleEl = document.getElementById("client-hud-title");
        const subtitleEl = document.getElementById("client-hud-subtitle");
        const iconEl = document.getElementById("client-role-icon");
        const toggleBtn = document.getElementById("btn-client-toggle-view");

        if (session.role === "supplier") {
          if (iconEl) iconEl.textContent = "📦";
          if (titleEl) titleEl.textContent = (session.user?.businessName || "Vanessa Castellar Shoes") + " (Bodega Matriz)";
          if (subtitleEl) subtitleEl.textContent = "🟢 Panel Privado B2B • Inventario & Sneaker Partners";
          if (toggleBtn) toggleBtn.textContent = currentView === "storefront" ? "📦 Volver al Panel Bodega" : "🛒 Ver Mi Vitrina Pública";
        } else {
          if (iconEl) iconEl.textContent = "🏪";
          if (titleEl) titleEl.textContent = (session.user?.name || "Cali Shoes") + " (Sneaker Partner)";
          if (subtitleEl) subtitleEl.textContent = "🟢 Margen Propio & Catálogo Sincronizado";
          if (toggleBtn) toggleBtn.textContent = currentView === "storefront" ? "🏪 Volver a Mi Panel Tienda" : "🛒 Ver Mi Vitrina con Margen";
        }

        // Toggle entre panel privado y vitrina
        if (toggleBtn) {
          toggleBtn.onclick = () => {
            if (currentView === "storefront") {
              switchView(session.role);
            } else {
              switchView("storefront");
            }
          };
        }

        const clientAccountBtn = document.getElementById("btn-client-open-account");
        if (clientAccountBtn) {
          clientAccountBtn.onclick = () => {
            const accModal = document.getElementById("modal-account-settings");
            if (accModal) accModal.classList.add("open");
          };
        }

        const clientLogoutBtn = document.getElementById("btn-client-logout");
        if (clientLogoutBtn) {
          clientLogoutBtn.onclick = () => {
            if (confirm("¿Deseas cerrar tu sesión segura?")) {
              db.logout();
              window.location.href = "index.html?view=storefront";
            }
          };
        }
      }
    }
    // SI ES UN COMPRADOR O VISITANTE PÚBLICO: AMBAS BARRAS PERMANECEN OCULTAS (100% LIMPIO)

    // Handler botón copiar link partner en el panel bodega
    const btnCopyPartner = document.getElementById("btn-copy-partner-link");
    if (btnCopyPartner) {
      btnCopyPartner.onclick = () => {
        const link = window.location.origin + "/admin.html?partner=vanessa";
        navigator.clipboard?.writeText(link).then(() => {
          showToast("🔗 Enlace copiado: " + link);
        }).catch(() => {
          prompt("Copia este enlace de invitación para tu nuevo Sneaker Partner:", link);
        });
      };
    }

    // Handler botón logout en master HUD
    const btnLogoutHud = document.getElementById("btn-logout-hud");
    if (btnLogoutHud) {
      btnLogoutHud.onclick = () => {
        if (confirm("¿Cerrar sesión de Super-Admin?")) {
          db.logout();
          window.location.href = "index.html?view=storefront";
        }
      };
    }
  }

  // =========================================================================
  // NAVEGACIÓN Y AUTENTICACIÓN POR PIN
  // =========================================================================
  function setupNavigation() {
    const tabs = document.querySelectorAll(".role-tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetView = tab.dataset.view;
        
        // Proteger vistas administrativas si no se está autenticado
        if (targetView === "supplier" || targetView === "store-admin") {
          const session = db.getAuthSession();
          if (!session.authenticated || session.role !== targetView) {
            openAuthModal(targetView);
            return;
          }
        }

        switchView(targetView);
      });
    });

    // Selector de Tienda en el HUD
    const hudSelect = document.getElementById("hud-store-select");
    hudSelect.addEventListener("change", (e) => {
      db.setCurrentStoreId(e.target.value);
      renderCurrentView();
      showToast("Vitrina cambiada a: " + db.getCurrentStore().name);
    });

    // Botón de Reset
    document.getElementById("btn-reset-demo").addEventListener("click", () => {
      if (confirm("¿Deseas restaurar los datos del catálogo y pedidos a los valores iniciales de fábrica?")) {
        db.resetToDefaults();
        cart = [];
        updateFloatingCartUI();
        initApp();
        showToast("Catálogo restablecido con éxito.");
      }
    });
  }

  function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll(".role-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    document.querySelectorAll(".view-panel").forEach(panel => {
      panel.style.display = panel.id === `view-${viewName}` ? "block" : "none";
    });

    // Actualizar texto del botón de vitrina en la barra del cliente
    const toggleBtn = document.getElementById("btn-client-toggle-view");
    const session = db.getAuthSession();
    if (toggleBtn && session.authenticated) {
      if (session.role === "supplier") {
        toggleBtn.textContent = currentView === "storefront" ? "📦 Volver al Panel Bodega" : "🛒 Ver Mi Vitrina Pública";
      } else {
        toggleBtn.textContent = currentView === "storefront" ? "🏪 Volver a Mi Panel Tienda" : "🛒 Ver Mi Vitrina con Margen";
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    renderCurrentView();
  }

  function renderCurrentView() {
    const store = db.getCurrentStore();
    if (currentView === "storefront") renderStorefront(store);
    else if (currentView === "store-admin") renderStoreAdmin(store);
    else if (currentView === "supplier") renderSupplierAdmin();
    else if (currentView === "directory") renderDirectory();
  }

  // =========================================================================
  // MODAL DE AUTENTICACIÓN / PROTECCIÓN POR PIN
  // =========================================================================
  function setupAuthModal() {
    const modal = document.getElementById("modal-auth-pin");
    const form = document.getElementById("form-auth-pin");
    const pinInput = document.getElementById("auth-pin-input");
    const errorMsg = document.getElementById("auth-error-msg");
    const btnCancel = document.getElementById("btn-cancel-auth");
    const btnDemo = document.getElementById("btn-quick-demo-access");

    btnCancel.addEventListener("click", () => modal.classList.remove("open"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const targetRole = document.getElementById("auth-target-role").value;
      const pin = pinInput.value.trim();
      const res = db.authenticate(targetRole, pin);

      if (res.success) {
        modal.classList.remove("open");
        errorMsg.style.display = "none";
        pinInput.value = "";
        switchView(targetRole);
        showToast(`Acceso autorizado a ${targetRole === 'supplier' ? 'Bodega Central' : 'Panel de Tienda'}`);
      } else {
        errorMsg.style.display = "block";
        errorMsg.textContent = res.message || "PIN incorrecto. Prueba 8820.";
      }
    });

    btnDemo.addEventListener("click", () => {
      const targetRole = document.getElementById("auth-target-role").value;
      db.authenticate(targetRole, targetRole === "supplier" ? "8820" : "1234");
      modal.classList.remove("open");
      errorMsg.style.display = "none";
      pinInput.value = "";
      switchView(targetRole);
      showToast("Acceso Demo concedido.");
    });
  }

  function openAuthModal(targetRole) {
    const modal = document.getElementById("modal-auth-pin");
    const targetInput = document.getElementById("auth-target-role");
    const title = document.getElementById("auth-modal-title");
    const desc = document.getElementById("auth-modal-desc");
    const pinInput = document.getElementById("auth-pin-input");
    const errorMsg = document.getElementById("auth-error-msg");

    targetInput.value = targetRole;
    errorMsg.style.display = "none";
    pinInput.value = "";

    if (targetRole === "supplier") {
      title.textContent = "Acceso a Bodega Central";
      desc.textContent = "Ingresa el PIN de seguridad de Vanessa Castellar (PIN: 8820) para gestionar costos mayoristas e inventario matriz.";
    } else {
      title.textContent = "Acceso a Panel de Sneaker Partner";
      desc.textContent = "Ingresa el PIN de tu vitrina aliada (PIN: 1234) para modificar precios y margen de ganancia.";
    }

    modal.classList.add("open");
    pinInput.focus();
  }

  function renderHudStores() {
    const select = document.getElementById("hud-store-select");
    const stores = db.getStores();
    const currentId = db.getCurrentStoreId();

    select.innerHTML = stores.map(s => `
      <option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>
        ${s.name} ${s.isSupplierStore ? '(Matriz)' : '(Satélite)'}
      </option>
    `).join("");
  }

  // =========================================================================
  // VISTA 1: VITRINA PÚBLICA (STOREFRONT)
  // =========================================================================
  function renderStorefront(store) {
    // Render Header Info
    document.getElementById("storefront-avatar").textContent = store.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    document.getElementById("storefront-name").innerHTML = `${store.name} <span class="badge-verified" id="storefront-badge">${store.isSupplierStore ? 'BODEGA MATRIZ VERIFICADA' : 'TIENDA AUTORIZADA'}</span>`;
    document.getElementById("storefront-tagline").textContent = store.tagline;
    document.getElementById("storefront-location").textContent = store.neighborhood + " | ⚡ Domicilios Hoy";

    // Enlace directo WhatsApp Header (Usa balanceador inteligente)
    const directPhone = db.getNextWhatsAppLine(store);
    document.getElementById("storefront-wa-direct").href = `https://wa.me/${directPhone}?text=${encodeURIComponent('👋 ¡Hola! Estoy viendo la vitrina digital de ' + store.name + ' y quiero consultar disponibilidad de calzado.')}`;

    // Obtener productos visibles
    const products = db.getStorefrontProducts(store);

    // Aplicar Filtros
    let filtered = products.filter(p => {
      // Filtro de Marca
      if (activeBrandFilter !== "all") {
        const brand = activeBrandFilter.toLowerCase();
        const text = (p.name + " " + p.category).toLowerCase();
        if (brand === "nike" && !text.includes("nike") && !text.includes("jordan")) return false;
        if (brand === "adidas" && !text.includes("adidas") && !text.includes("samba") && !text.includes("superstar")) return false;
        if (brand === "on" && !text.includes("on cloud") && !text.includes("cloudmonster") && !text.includes("cloud 5")) return false;
        if (brand === "nb" && !text.includes("new balance") && !text.includes("9060")) return false;
        if (brand === "luxury" && !text.includes("lv") && !text.includes("boss") && !text.includes("titanium")) return false;
        if (brand === "skechers" && !text.includes("skechers") && !text.includes("trail")) return false;
      }

      // Filtro de Talla
      if (activeSizeFilter !== "all") {
        const targetSize = parseInt(activeSizeFilter, 10);
        if (!p.storeAvailableSizes || !p.storeAvailableSizes.includes(targetSize)) return false;
      }

      // Filtro de Categoría
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }

      // Filtro de Búsqueda de Texto
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const match = p.name.toLowerCase().includes(q) ||
                      p.sku.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q) ||
                      p.tagline.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Ordenamiento
    if (sortOrder === "price-asc") filtered.sort((a, b) => a.storeRetailPrice - b.storeRetailPrice);
    else if (sortOrder === "price-desc") filtered.sort((a, b) => b.storeRetailPrice - a.storeRetailPrice);
    else if (sortOrder === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Contador
    document.getElementById("storefront-count-badge").textContent = `${filtered.length} modelos disponibles`;

    // Render Grid
    const grid = document.getElementById("storefront-products-grid");
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <div style="font-size: 40px; margin-bottom: 12px;">👟</div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">No se encontraron modelos con estos filtros</h3>
          <p style="color: var(--text-secondary); font-size: 13px; margin-top: 6px;">Prueba seleccionando "Todas" las tallas o limpiando la barra de búsqueda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const formattedPrice = db.formatCOP(p.storeRetailPrice);
      const colorCount = p.colorways ? p.colorways.length : 1;

      const sizeBadges = (p.storeAvailableSizes || []).map(sz => {
        const isSelected = activeSizeFilter !== "all" && parseInt(activeSizeFilter, 10) === sz;
        return `<span class="size-mini-badge ${isSelected ? 'highlight' : ''}">${sz}</span>`;
      }).join("");

      return `
        <div class="product-card" data-product-id="${p.id}">
          <div class="product-image-box">
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy">
            <div class="product-badges">
              <span class="category-tag">${p.category}</span>
              <span class="sku-tag">${colorCount > 1 ? `🎨 ${colorCount} Colores` : p.sku}</span>
              ${p.campaignBadge ? `<span class="campaign-badge-pill" style="background: linear-gradient(135deg, #e6192e, #b91c1c); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; box-shadow: 0 2px 8px rgba(230,25,46,0.35);">${p.campaignBadge}</span>` : ''}
            </div>
          </div>
          <div class="product-body">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.tagline}</p>
            
            <div style="margin-bottom: 6px; font-size: 11px; font-weight: 700; color: var(--text-muted);">Tallas en stock:</div>
            <div class="product-sizes-chips">${sizeBadges}</div>

            <div class="product-footer">
              <div class="price-box">
                <span class="price-label">Precio Tienda</span>
                <span class="price-val">${formattedPrice}</span>
              </div>
              <button type="button" class="btn-card-wa btn-open-product-modal" data-product-id="${p.id}">
                <span>💬 Pedir</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Abrir Modal de Producto al hacer clic
    grid.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", () => {
        const prodId = card.dataset.productId;
        const prod = products.find(p => p.id === prodId);
        if (prod) openProductModal(store, prod);
      });
    });
  }

  // =========================================================================
  // FILTROS Y BÚSQUEDA EN TIEMPO REAL
  // =========================================================================
  function setupFilters() {
    // Chips de Marcas
    document.querySelectorAll(".brand-chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".brand-chip-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeBrandFilter = btn.dataset.brand;
        renderStorefront(db.getCurrentStore());
      });
    });

    // Pills de Tallas Físicas
    document.querySelectorAll(".size-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".size-pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeSizeFilter = btn.dataset.size;
        renderStorefront(db.getCurrentStore());
      });
    });

    // Input de Búsqueda
    const searchInput = document.getElementById("storefront-search-input");
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderStorefront(db.getCurrentStore());
    });

    // Selectores
    document.getElementById("storefront-cat-select").addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      renderStorefront(db.getCurrentStore());
    });

    document.getElementById("storefront-sort-select").addEventListener("change", (e) => {
      sortOrder = e.target.value;
      renderStorefront(db.getCurrentStore());
    });
  }

  // =========================================================================
  // MODAL DE DETALLE DE PRODUCTO Y AGREGAR AL CARRITO
  // =========================================================================
  function openProductModal(store, product) {
    const modal = document.getElementById("modal-product-detail");
    const title = document.getElementById("modal-product-title");
    const body = document.getElementById("modal-product-body");

    title.textContent = product.name;

    let selectedColorway = product.colorways && product.colorways.length > 0 ? product.colorways[0] : null;
    let selectedSize = product.storeAvailableSizes && product.storeAvailableSizes.length > 0 ? product.storeAvailableSizes[0] : 38;

    function renderModalContent() {
      const activeImg = selectedColorway ? selectedColorway.image : product.image;
      const formattedPrice = db.formatCOP(product.storeRetailPrice);
      const cm = db.getSizeCm(selectedSize);

      const colorChips = (product.colorways || []).map((cw, idx) => `
        <button type="button" class="colorway-badge-chip ${selectedColorway && selectedColorway.sku === cw.sku ? 'active' : ''}" data-index="${idx}">
          <span class="colorway-dot"></span>
          <span>${cw.name}</span>
        </button>
      `).join("");

      const sizePills = (product.storeAvailableSizes || []).map(sz => `
        <button type="button" class="size-pill-btn ${selectedSize === sz ? 'active' : ''}" data-size="${sz}">
          ${sz} (${db.getSizeCm(sz)})
        </button>
      `).join("");

      body.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px; height: 220px; border-radius: var(--radius-md); overflow: hidden; background: #f1f5f9; border: 1px solid var(--border-subtle);">
            <img src="${activeImg}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="flex: 1.2; min-width: 240px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11px; font-weight: 800; color: var(--primary-red); text-transform: uppercase;">${product.category} • SKU: ${product.sku}</div>
            <h4 style="font-size: 18px; font-weight: 900; color: var(--text-primary); margin: 4px 0 8px;">${product.name}</h4>
            <div style="font-size: 22px; font-weight: 900; color: var(--primary-red); margin-bottom: 8px;">${formattedPrice}</div>
            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${product.description || product.tagline}</p>
          </div>
        </div>

        ${product.colorways && product.colorways.length > 1 ? `
          <div class="form-group">
            <label class="form-label">Colorway / Edición:</label>
            <div class="colorway-chips-row">${colorChips}</div>
          </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Selecciona tu Talla en cm (Plantilla):</label>
          <div class="size-pills-row" style="flex-wrap: wrap;">${sizePills}</div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn-secondary" id="btn-add-to-cart" style="flex: 1; justify-content: center;">
            🛍️ Agregar a la Bolsa
          </button>
          <a href="#" id="btn-modal-wa-direct" target="_blank" rel="noopener" class="btn-primary" style="flex: 1.2; justify-content: center; background: #25d366;">
            💬 Pedir 1 Par por WhatsApp
          </a>
        </div>
      `;

      // Eventos de selección de color
      body.querySelectorAll(".colorway-badge-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.index, 10);
          selectedColorway = product.colorways[idx];
          renderModalContent();
        });
      });

      // Eventos de selección de talla
      body.querySelectorAll(".size-pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedSize = parseInt(btn.dataset.size, 10);
          renderModalContent();
        });
      });

      // Agregar al carrito
      body.querySelector("#btn-add-to-cart").addEventListener("click", () => {
        addToCart(product, selectedColorway, selectedSize);
        modal.classList.remove("open");
      });

      // WhatsApp directo
      const directWaUrl = db.buildSingleProductWhatsAppUrl(store, product, selectedColorway, selectedSize);
      body.querySelector("#btn-modal-wa-direct").href = directWaUrl;
    }

    renderModalContent();
    modal.classList.add("open");

    document.getElementById("btn-close-product-modal").onclick = () => modal.classList.remove("open");
  }

  // =========================================================================
  // CARRITO MULTI-PAR Y BOLSA DE PEDIDOS
  // =========================================================================
  function addToCart(product, colorway, size) {
    const colorName = colorway ? colorway.name : "Color Principal";
    const img = colorway ? colorway.image : product.image;
    const cartItemId = `${product.id}-${size}-${colorName}`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        cartItemId,
        productId: product.id,
        name: product.name,
        price: product.storeRetailPrice,
        size,
        colorway: colorName,
        image: img,
        quantity: 1
      });
    }

    updateFloatingCartUI();
    showToast(`👟 ${product.name} (Talla ${size}) agregado a la bolsa.`);
    startCartTimer();
  }

  function updateFloatingCartUI() {
    const bar = document.getElementById("floating-cart-bar");
    const countEl = document.getElementById("floating-cart-count");
    const totalEl = document.getElementById("floating-cart-total");

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (totalCount > 0) {
      countEl.textContent = `${totalCount} Par${totalCount > 1 ? 'es' : ''} en Bolsa`;
      totalEl.textContent = db.formatCOP(totalPrice);
      bar.classList.add("visible");
    } else {
      bar.classList.remove("visible");
    }
  }

  function startCartTimer() {
    if (timerInterval) clearInterval(timerInterval);
    cartReservationTimer = 20 * 60; // 20 min

    timerInterval = setInterval(() => {
      cartReservationTimer--;
      if (cartReservationTimer <= 0) {
        clearInterval(timerInterval);
        cartReservationTimer = 0;
      }
      const mins = Math.floor(cartReservationTimer / 60);
      const secs = cartReservationTimer % 60;
      const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const timerEl = document.getElementById("cart-timer-countdown");
      if (timerEl) timerEl.textContent = display;
    }, 1000);
  }

  function setupCartDrawer() {
    const bar = document.getElementById("floating-cart-bar");
    const drawer = document.getElementById("modal-cart-drawer");
    const closeBtn = document.getElementById("btn-close-cart-drawer");
    const shippingSelect = document.getElementById("cart-shipping-select");

    // Población de Barrios de Cali
    shippingSelect.innerHTML = CALI_NEIGHBORHOODS.map((z, i) => `
      <option value="${i}">
        ${z.name} — ${db.formatCOP(z.fee)} (${z.time})
      </option>
    `).join("");

    bar.addEventListener("click", () => {
      renderCartDrawerContent();
      drawer.classList.add("open");
    });

    closeBtn.addEventListener("click", () => drawer.classList.remove("open"));

    shippingSelect.addEventListener("change", () => renderCartDrawerContent());

    // Modalidad de Despacho
    drawer.querySelectorAll(".dispatch-radio-card").forEach(card => {
      card.addEventListener("click", () => {
        drawer.querySelectorAll(".dispatch-radio-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        card.querySelector("input").checked = true;
      });
    });

    // Enviar por WhatsApp
    document.getElementById("btn-send-cart-whatsapp").addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
      }

      const store = db.getCurrentStore();
      const zoneIdx = parseInt(shippingSelect.value, 10);
      const shippingZone = CALI_NEIGHBORHOODS[zoneIdx];
      const clientName = document.getElementById("cart-client-name").value.trim();
      const clientAddress = document.getElementById("cart-client-address").value.trim();
      const dispatchMode = drawer.querySelector("input[name='dispatch-mode']:checked").value;

      const waUrl = db.buildConsolidatedCartWhatsAppUrl(
        store,
        cart,
        { name: clientName, address: clientAddress },
        shippingZone,
        dispatchMode
      );

      // Registrar pedido B2B en la bodega
      cart.forEach(item => {
        db.addB2BOrder({
          storeName: store.name,
          productName: item.name,
          size: item.size,
          colorway: item.colorway,
          units: item.quantity,
          totalWholesale: item.price * item.quantity * 0.65 // aproximación mayorista
        });
      });

      window.open(waUrl, "_blank");
      drawer.classList.remove("open");
      cart = [];
      updateFloatingCartUI();
      showToast("¡Comanda generada! Abriendo WhatsApp de la asesora...");
    });
  }

  function renderCartDrawerContent() {
    const list = document.getElementById("cart-items-list");
    const countBadge = document.getElementById("cart-drawer-count");
    const subtotalEl = document.getElementById("cart-summary-subtotal");
    const shippingEl = document.getElementById("cart-summary-shipping");
    const grandTotalEl = document.getElementById("cart-summary-grandtotal");
    const shippingSelect = document.getElementById("cart-shipping-select");

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const zoneIdx = parseInt(shippingSelect.value || "0", 10);
    const shippingZone = CALI_NEIGHBORHOODS[zoneIdx] || CALI_NEIGHBORHOODS[0];
    const shippingFee = shippingZone.fee;
    const grandTotal = totalPrice + shippingFee;

    countBadge.textContent = `${totalCount} ${totalCount === 1 ? 'par' : 'pares'}`;
    subtotalEl.textContent = db.formatCOP(totalPrice);
    shippingEl.textContent = db.formatCOP(shippingFee);
    grandTotalEl.textContent = db.formatCOP(grandTotal);

    if (cart.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Tu bolsa de compras está vacía.</div>`;
      return;
    }

    list.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-meta">Talla: <strong>${item.size}</strong> (${db.getSizeCm(item.size)}) • ${item.colorway}</div>
          <div class="cart-item-price">${db.formatCOP(item.price * item.quantity)}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn-action-sm btn-qty-minus" data-id="${item.cartItemId}" style="padding: 2px 8px;">-</button>
          <span style="font-size: 12px; font-weight: 800; min-width: 16px; text-align: center;">${item.quantity}</span>
          <button class="btn-action-sm btn-qty-plus" data-id="${item.cartItemId}" style="padding: 2px 8px;">+</button>
          <button class="cart-item-remove btn-remove-item" data-id="${item.cartItemId}" title="Eliminar">&times;</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-qty-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = cart.find(i => i.cartItemId === btn.dataset.id);
        if (item) {
          item.quantity++;
          updateFloatingCartUI();
          renderCartDrawerContent();
        }
      });
    });

    list.querySelectorAll(".btn-qty-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = cart.find(i => i.cartItemId === btn.dataset.id);
        if (item) {
          item.quantity--;
          if (item.quantity <= 0) cart = cart.filter(i => i.cartItemId !== btn.dataset.id);
          updateFloatingCartUI();
          renderCartDrawerContent();
        }
      });
    });

    list.querySelectorAll(".btn-remove-item").forEach(btn => {
      btn.addEventListener("click", () => {
        cart = cart.filter(i => i.cartItemId !== btn.dataset.id);
        updateFloatingCartUI();
        renderCartDrawerContent();
      });
    });
  }

  // =========================================================================
  // VISTA 2: PANEL DE LA TIENDA SATÉLITE (ADMINISTRACIÓN MARCA BLANCA)
  // =========================================================================
  function renderStoreAdmin(store) {
    document.getElementById("admin-store-title").textContent = `Gestión de Precios — ${store.name}`;
    document.getElementById("stat-phone-preview").textContent = `+${store.phone}`;

    const masterProds = db.getMasterProducts(true);
    const activeCount = store.products.filter(p => p.active).length;
    document.getElementById("stat-active-prods").textContent = activeCount;

    // Calcular Margen Promedio
    let totalMargin = 0;
    let marginCount = 0;
    masterProds.forEach(mp => {
      const sp = store.products.find(p => p.productId === mp.id);
      if (sp && sp.active) {
        const price = sp.customPrice || mp.suggestedRetailPrice;
        totalMargin += (price - mp.wholesalePrice);
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? totalMargin / marginCount : 0;
    document.getElementById("stat-avg-margin").textContent = db.formatCOP(avgMargin);

    // Render Tabla
    const tbody = document.getElementById("store-admin-products-table");
    tbody.innerHTML = masterProds.map(mp => {
      const sp = store.products.find(p => p.productId === mp.id) || {
        active: false,
        customPrice: mp.suggestedRetailPrice,
        availableSizes: [...mp.sizes]
      };

      const retailPrice = sp.customPrice || mp.suggestedRetailPrice;
      const margin = retailPrice - mp.wholesalePrice;
      const marginClass = margin >= 60000 ? "margin-high" : "margin-normal";

      const sizeBadges = (mp.sizes || []).map(sz => {
        const isAvail = sp.availableSizes && sp.availableSizes.includes(sz);
        return `<span class="table-size-tag ${isAvail ? 'active' : 'inactive'}" data-prod="${mp.id}" data-size="${sz}">${sz}</span>`;
      }).join("");

      return `
        <tr>
          <td>
            <div class="td-product-cell">
              <img src="${mp.image}" alt="${mp.name}" class="td-product-thumb">
              <div>
                <div class="td-product-name">${mp.name}</div>
                <div class="td-product-sku">${mp.sku} • ${mp.category}</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 700; color: var(--text-primary);">${db.formatCOP(mp.wholesalePrice)}</td>
          <td>
            <input type="number" class="table-input-price input-store-price" data-prod="${mp.id}" value="${retailPrice}" step="5000">
          </td>
          <td>
            <span class="margin-badge ${marginClass}">+${db.formatCOP(margin)}</span>
          </td>
          <td>
            <div class="table-sizes-list">${sizeBadges}</div>
          </td>
          <td>
            <label class="switch-toggle">
              <input type="checkbox" class="toggle-store-active" data-prod="${mp.id}" ${sp.active ? 'checked' : ''}>
              <span class="slider-round"></span>
            </label>
          </td>
        </tr>
      `;
    }).join("");

    // Eventos: Guardar cambios de precios
    document.getElementById("btn-save-store-prices").onclick = () => {
      tbody.querySelectorAll(".input-store-price").forEach(input => {
        const prodId = input.dataset.prod;
        const newPrice = Number(input.value);
        db.updateStoreProductPrice(store.id, prodId, newPrice);
      });
      showToast("¡Precios y márgenes de ganancia guardados con éxito!");
      renderStoreAdmin(db.getCurrentStore());
    };

    // Eventos: Toggle de activación / visibilidad en vitrina
    tbody.querySelectorAll(".toggle-store-active").forEach(chk => {
      chk.addEventListener("change", () => {
        const prodId = chk.dataset.prod;
        const isActive = db.toggleStoreProductActive(store.id, prodId);
        
        // Actualizar contador reactivo
        const updatedStore = db.getCurrentStore();
        const activeCount = (updatedStore.products || []).filter(p => p.active !== false).length;
        document.getElementById("stat-active-prods").textContent = activeCount;
        
        showToast(isActive ? "✅ Modelo activado en tu vitrina." : "🚫 Modelo ocultado de tu vitrina.");
      });
    });

    // Eventos: Toggle de tallas específicas en stock
    tbody.querySelectorAll(".table-size-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const prodId = tag.dataset.prod;
        const size = tag.dataset.size;
        const isNowActive = db.toggleStoreSize(store.id, prodId, size);

        tag.classList.toggle("active", isNowActive);
        tag.classList.toggle("inactive", !isNowActive);

        showToast(isNowActive ? `Talla ${size} activada en stock.` : `Talla ${size} deshabilitada.`);
      });
    });

    // Eventos: Recalcular margen en tiempo real al tipear precio
    tbody.querySelectorAll(".input-store-price").forEach(input => {
      input.addEventListener("input", () => {
        const row = input.closest("tr");
        const wholesaleText = row.querySelector("td:nth-child(2)").textContent;
        const wholesaleNum = parseInt(wholesaleText.replace(/[^0-9]/g, ""), 10) || 0;
        const retailNum = Number(input.value) || 0;
        const margin = retailNum - wholesaleNum;
        
        const badge = row.querySelector(".margin-badge");
        if (badge) {
          badge.textContent = `+${db.formatCOP(margin)}`;
          badge.className = `margin-badge ${margin >= 60000 ? 'margin-high' : 'margin-normal'}`;
        }
      });
    });
  }

  // =========================================================================
  // VISTA 3: PANEL BODEGA CENTRAL (VANESSA CASTELLAR SHOES)
  // =========================================================================
  function renderSupplierAdmin() {
    const products = db.getMasterProducts(false);
    const orders = db.getOrders();

    document.getElementById("stat-supplier-total-prods").textContent = products.length;

    // 1. Tabla de Catálogo Maestro & Precios en Caliente
    const masterTbody = document.getElementById("supplier-master-products-table");
    if (masterTbody) {
      masterTbody.innerHTML = products.map(p => {
        const campaign = p.campaignBadge || "";
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.image}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight: 800; color: var(--text-primary); font-size: 13px;">${p.name}</div>
                  <div style="font-size: 10px; color: var(--text-muted); font-family: monospace;">SKU: ${p.sku}</div>
                </div>
              </div>
            </td>
            <td><span class="badge-verified" style="background: var(--bg-surface-elevated); color: var(--text-secondary); border-color: var(--border-subtle);">${p.category}</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: var(--text-muted);">$</span>
                <input type="number" class="form-input supplier-wholesale-input" data-prod-id="${p.id}" value="${p.wholesalePrice}" style="width: 100px; padding: 4px 6px; font-weight: 700; font-size: 12px;" step="1000">
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: var(--text-muted);">$</span>
                <input type="number" class="form-input supplier-retail-input" data-prod-id="${p.id}" value="${p.suggestedRetailPrice}" style="width: 100px; padding: 4px 6px; font-weight: 800; color: var(--primary-red); font-size: 12px;" step="1000">
              </div>
            </td>
            <td>
              <select class="form-select supplier-campaign-select" data-prod-id="${p.id}" style="font-size: 11px; padding: 4px 8px; font-weight: 700; max-width: 140px;">
                <option value="" ${campaign === "" ? "selected" : ""}>Precio Regular</option>
                <option value="🔥 Promo Fin de Semana" ${campaign.includes("Promo") ? "selected" : ""}>🔥 Promo Fin de Semana</option>
                <option value="⚡ Liquidación Tallas" ${campaign.includes("Liquidación") ? "selected" : ""}>⚡ Liquidación Tallas</option>
                <option value="🌟 Nuevo Drop 2026" ${campaign.includes("Drop") ? "selected" : ""}>🌟 Nuevo Drop</option>
                <option value="👑 Más Vendido" ${campaign.includes("Vendido") ? "selected" : ""}>👑 Más Vendido</option>
              </select>
            </td>
            <td>
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">${p.sizes.join(", ")}</span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn-action-sm btn-edit-master-modal" data-prod-id="${p.id}" style="font-size: 11px; padding: 5px 10px; font-weight: 700;" title="Editar Ficha Completa">
                  ✏️ Ficha
                </button>
                <button type="button" class="btn-action-sm btn-save-single-master" data-prod-id="${p.id}" style="font-size: 11px; padding: 5px 10px; font-weight: 700; color: #16a34a; border-color: #86efac; background: #f0fdf4;" title="Guardar Cambios">
                  💾
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");

      // Handlers de Guardar Individual
      masterTbody.querySelectorAll(".btn-save-single-master").forEach(btn => {
        btn.onclick = () => {
          const prodId = btn.dataset.prodId;
          const wholesale = Number(masterTbody.querySelector(`.supplier-wholesale-input[data-prod-id="${prodId}"]`)?.value) || 120000;
          const retail = Number(masterTbody.querySelector(`.supplier-retail-input[data-prod-id="${prodId}"]`)?.value) || 190000;
          const campaign = masterTbody.querySelector(`.supplier-campaign-select[data-prod-id="${prodId}"]`)?.value || "";

          db.updateMasterProduct(prodId, {
            wholesalePrice: wholesale,
            suggestedRetailPrice: retail,
            campaignBadge: campaign
          });

          showToast("✅ Referencia actualizada en tiempo real.");
        };
      });

      // Handlers de Editar Ficha Completa en Modal
      masterTbody.querySelectorAll(".btn-edit-master-modal").forEach(btn => {
        btn.onclick = () => {
          const prodId = btn.dataset.prodId;
          const prod = products.find(p => p.id === prodId);
          if (!prod) return;

          document.getElementById("modal-product-title").textContent = "Editar Referencia de Catálogo";
          document.getElementById("btn-submit-product-form").textContent = "Guardar Modificaciones";
          document.getElementById("add-prod-id").value = prod.id;
          document.getElementById("add-prod-name").value = prod.name;
          document.getElementById("add-prod-cat").value = prod.category;
          document.getElementById("add-prod-wholesale").value = prod.wholesalePrice;
          document.getElementById("add-prod-retail").value = prod.suggestedRetailPrice;
          document.getElementById("add-prod-sizes").value = prod.sizes.join(", ");
          document.getElementById("add-prod-desc").value = prod.description || "";
          document.getElementById("add-prod-campaign").value = prod.campaignBadge || "";

          document.getElementById("modal-add-product").classList.add("open");
        };
      });
    }

    // Botón Guardar Todos los Cambios en Lote
    const btnSaveAll = document.getElementById("btn-save-all-supplier-prices");
    if (btnSaveAll) {
      btnSaveAll.onclick = () => {
        const rows = masterTbody.querySelectorAll("tr");
        rows.forEach(tr => {
          const wholesaleInput = tr.querySelector(".supplier-wholesale-input");
          const retailInput = tr.querySelector(".supplier-retail-input");
          const campaignSelect = tr.querySelector(".supplier-campaign-select");

          if (wholesaleInput && retailInput) {
            const prodId = wholesaleInput.dataset.prodId;
            db.updateMasterProduct(prodId, {
              wholesalePrice: Number(wholesaleInput.value),
              suggestedRetailPrice: Number(retailInput.value),
              campaignBadge: campaignSelect?.value || ""
            });
          }
        });
        showToast("✅ Todos los precios y campañas guardados para la red SNEAKER WORLD.");
      };
    }

    // 2. Tabla de Pedidos B2B
    const tbody = document.getElementById("supplier-orders-table");
    if (tbody) {
      tbody.innerHTML = orders.map(ord => `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#${ord.id}</td>
          <td>${ord.date}</td>
          <td style="font-weight: 700; color: var(--text-primary);">${ord.storeName}</td>
          <td>${ord.productName}</td>
          <td><span class="table-size-tag active">${ord.size}</span></td>
          <td style="font-weight: 800;">${ord.units} pares</td>
          <td style="font-weight: 800; color: var(--primary-red);">${db.formatCOP(ord.totalWholesale)}</td>
          <td><span class="badge-verified">${ord.status}</span></td>
        </tr>
      `).join("");
    }
  }

  function setupAddProductModal() {
    const btnOpen = document.getElementById("btn-open-add-product");
    const modal = document.getElementById("modal-add-product");
    const btnClose = document.getElementById("btn-close-add-modal");
    const btnCancel = document.getElementById("btn-cancel-add-product");
    const form = document.getElementById("form-add-product");

    btnOpen.onclick = () => {
      document.getElementById("modal-product-title").textContent = "Publicar Nueva Referencia en Bodega";
      document.getElementById("btn-submit-product-form").textContent = "Publicar a Todas las Tiendas";
      form.reset();
      document.getElementById("add-prod-id").value = "";
      modal.classList.add("open");
    };

    btnClose.onclick = () => modal.classList.remove("open");
    btnCancel.onclick = () => modal.classList.remove("open");

    form.onsubmit = (e) => {
      e.preventDefault();
      const prodId = document.getElementById("add-prod-id").value;
      const name = document.getElementById("add-prod-name").value.trim();
      const cat = document.getElementById("add-prod-cat").value;
      const wholesale = document.getElementById("add-prod-wholesale").value;
      const retail = document.getElementById("add-prod-retail").value;
      const sizesStr = document.getElementById("add-prod-sizes").value;
      const desc = document.getElementById("add-prod-desc").value.trim();
      const campaign = document.getElementById("add-prod-campaign").value;

      const sizes = sizesStr.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

      if (prodId) {
        // Modo Edición
        db.updateMasterProduct(prodId, {
          name,
          category: cat,
          wholesalePrice: wholesale,
          suggestedRetailPrice: retail,
          sizes,
          description: desc,
          campaignBadge: campaign
        });
        showToast(`✅ Referencia ${name} modificada con éxito.`);
      } else {
        // Modo Creación
        db.addMasterProduct({
          name,
          category: cat,
          wholesalePrice: wholesale,
          suggestedRetailPrice: retail,
          sizes,
          description: desc,
          campaignBadge: campaign
        });
        showToast(`✅ ¡Nueva referencia ${name} publicada a toda la red!`);
      }

      modal.classList.remove("open");
      form.reset();
      renderSupplierAdmin();
    };
  }

  // =========================================================================
  // VISTA 4: DIRECTORIO DE TIENDAS Y SIMULADOR ROI
  // =========================================================================
  function renderDirectory() {
    const stores = db.getStores();
    const grid = document.getElementById("directory-stores-grid");

    grid.innerHTML = stores.map(s => {
      const activeCount = s.products.filter(p => p.active).length;
      return `
        <div class="store-directory-card">
          <div class="store-card-header">
            <div class="store-card-avatar">${s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
            <div>
              <div class="store-card-title">${s.name}</div>
              <div class="store-card-location">${s.neighborhood}</div>
            </div>
          </div>
          <div class="store-card-body">${s.tagline}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
            <span style="font-size: 11px; font-weight: 700; color: var(--primary-red);">${activeCount} Modelos Sincronizados</span>
            <button class="btn-primary btn-switch-store-dir" data-id="${s.id}" style="font-size: 11px; padding: 6px 14px;">
              Ver Vitrina
            </button>
          </div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll(".btn-switch-store-dir").forEach(btn => {
      btn.addEventListener("click", () => {
        db.setCurrentStoreId(btn.dataset.id);
        renderHudStores();
        switchView("storefront");
      });
    });
  }

  function setupRoiCalculator() {
    const resellersSlider = document.getElementById("roi-resellers-slider");
    const pairsSlider = document.getElementById("roi-pairs-slider");
    const resellersVal = document.getElementById("roi-resellers-val");
    const pairsVal = document.getElementById("roi-pairs-val");
    const profitDisplay = document.getElementById("roi-profit-display");

    function calculateRoi() {
      const resellers = parseInt(resellersSlider.value, 10);
      const pairs = parseInt(pairsSlider.value, 10);
      resellersVal.textContent = resellers;
      pairsVal.textContent = pairs;

      // Ganancia Bodega: $25.000 COP por par vendido + $150.000 COP mensualidad SaaS por Sneaker Partner
      const pairProfits = resellers * pairs * 25000;
      const saasProfits = resellers * 150000;
      const totalMonthly = pairProfits + saasProfits;

      profitDisplay.textContent = db.formatCOP(totalMonthly) + " COP";
    }

    resellersSlider.addEventListener("input", calculateRoi);
    pairsSlider.addEventListener("input", calculateRoi);
    calculateRoi();
  }

  // =========================================================================
  // GESTIÓN DE CUENTA, SEGURIDAD & PREVENCIÓN DE PÉRDIDA DE DATOS
  // =========================================================================
  function setupAccountSettingsModal() {
    const btnOpen = document.getElementById("btn-open-account-settings");
    const modal = document.getElementById("modal-account-settings");
    const btnClose = document.getElementById("btn-close-account-modal");
    const form = document.getElementById("form-account-settings");
    const btnExport = document.getElementById("btn-export-backup-json");

    if (!modal || !btnOpen) return;

    btnOpen.onclick = () => {
      const accounts = db.getAccounts();
      const currentStore = db.getCurrentStore();
      const accountKey = (currentStore && currentStore.isSupplierStore) ? "vanessa" : "calishoes";
      const acc = accounts[accountKey] || accounts.vanessa;

      document.getElementById("account-key").value = accountKey;
      document.getElementById("account-name").value = acc.name || "";
      document.getElementById("account-email").value = acc.email || "";
      document.getElementById("account-password").value = acc.password || "Calishoes2026";
      document.getElementById("account-pin").value = acc.pin || (accountKey === "vanessa" ? "8820" : "1234");
      document.getElementById("account-phone").value = acc.phone || "573505337256";
      document.getElementById("modal-account-tenant-badge").textContent = `Inquilino: ${acc.tenantId} • ${acc.isMasterSupplier ? 'Bodega Matriz' : 'Tienda Satélite'}`;

      modal.classList.add("open");
    };

    if (btnClose) btnClose.onclick = () => modal.classList.remove("open");

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const key = document.getElementById("account-key").value;
        const name = document.getElementById("account-name").value.trim();
        const email = document.getElementById("account-email").value.trim();
        const password = document.getElementById("account-password").value.trim();
        const pin = document.getElementById("account-pin").value.trim();
        const phone = document.getElementById("account-phone").value.trim();

        db.updateAccountSecurity(key, { name, email, password, pin, phone });
        modal.classList.remove("open");
        showToast("🔒 Configuración de cuenta y seguridad guardada con éxito.");
      };
    }

    if (btnExport) {
      btnExport.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(db.exportBackupData());
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `sneakerworld_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("📥 Copia de seguridad JSON descargada.");
      };
    }
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
