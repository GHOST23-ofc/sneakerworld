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
    setupQuoteGenerator();
    setupInventoryStockMatrix();
    setupDirectoryFilters();
    setupAccountingReports();
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
    const waDirectBtn = document.getElementById("storefront-wa-direct");
    if (waDirectBtn) {
      waDirectBtn.href = `https://wa.me/${directPhone}?text=${encodeURIComponent('👋 ¡Hola! Estoy viendo la vitrina digital de ' + store.name + ' y quiero consultar disponibilidad de calzado.')}`;
      const span = waDirectBtn.querySelector("span");
      if (span) {
        span.textContent = store.isSupplierStore ? "💬 WhatsApp Dueño Bodega" : "💬 WhatsApp Directo";
      }
    }

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

      const colorName = selectedColorway ? selectedColorway.name : "Estándar";
      const stock = db.getProductStock(product.id, colorName, selectedSize);
      const isAgotado = stock <= 0;

      const colorChips = (product.colorways || []).map((cw, idx) => `
        <button type="button" class="colorway-badge-chip ${selectedColorway && selectedColorway.sku === cw.sku ? 'active' : ''}" data-index="${idx}">
          <span class="colorway-dot"></span>
          <span>${cw.name}</span>
        </button>
      `).join("");

      const sizePills = (product.storeAvailableSizes || []).map(sz => {
        const szStock = db.getProductStock(product.id, colorName, sz);
        const szSoldOut = szStock <= 0;
        return `
          <button type="button" class="size-pill-btn ${selectedSize === sz ? 'active' : ''} ${szSoldOut ? 'sold-out' : ''}" data-size="${sz}" style="${szSoldOut ? 'opacity: 0.45; text-decoration: line-through;' : ''}">
            ${sz} (${db.getSizeCm(sz)}) ${szSoldOut ? '❌' : ''}
          </button>
        `;
      }).join("");

      body.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px; height: 220px; border-radius: var(--radius-md); overflow: hidden; background: #f1f5f9; border: 1px solid var(--border-subtle);">
            <img src="${activeImg}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="flex: 1.2; min-width: 240px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11px; font-weight: 800; color: var(--primary-red); text-transform: uppercase;">${product.category} • SKU: ${product.sku}</div>
            <h4 style="font-size: 18px; font-weight: 900; color: var(--text-primary); margin: 4px 0 6px;">${product.name}</h4>
            <div style="font-size: 22px; font-weight: 900; color: var(--primary-red); margin-bottom: 6px;">${formattedPrice}</div>
            
            <div style="margin-bottom: 8px;">
              ${isAgotado 
                ? `<span class="badge-verified" style="background: #fef2f2; color: #dc2626; border-color: #fca5a5; font-size: 11px; font-weight: 800;">🔴 TALLA AGOTADA (${colorName} - Talla ${selectedSize})</span>`
                : (stock <= 3 
                    ? `<span class="badge-verified" style="background: #fffbeb; color: #d97706; border-color: #fcd34d; font-size: 11px; font-weight: 800;">⚡ ¡ÚLTIMOS ${stock} PARES DISPONIBLES EN BODEGA!</span>`
                    : `<span class="badge-verified" style="background: #f0fdf4; color: #16a34a; border-color: #86efac; font-size: 11px; font-weight: 800;">🟢 ${stock} PARES EN STOCK (BODEGA CALI)</span>`
                  )
              }
            </div>

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
          <button type="button" class="btn-secondary" id="btn-add-to-cart" style="flex: 1; justify-content: center; ${isAgotado ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            ${isAgotado ? '❌ Talla Agotada' : '🛍️ Agregar a la Bolsa'}
          </button>
          <a href="#" id="btn-modal-wa-direct" target="_blank" rel="noopener" class="btn-primary" style="flex: 1.2; justify-content: center; background: #25d366; ${isAgotado ? 'opacity: 0.5; pointer-events: none;' : ''}">
            ${isAgotado ? '❌ Agotado en Bodega' : '💬 Pedir 1 Par por WhatsApp'}
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
        if (isAgotado) {
          showToast("Esta talla y color están agotados temporalmente.");
          return;
        }
        addToCart(product, selectedColorway, selectedSize);
        modal.classList.remove("open");
      });

      // WhatsApp directo con auto-descuento de inventario
      const btnDirectWa = body.querySelector("#btn-modal-wa-direct");
      const directWaUrl = db.buildSingleProductWhatsAppUrl(store, product, selectedColorway, selectedSize);
      btnDirectWa.href = directWaUrl;
      btnDirectWa.onclick = () => {
        if (!isAgotado) {
          db.decrementStock(product.id, colorName, selectedSize, 1);
          showToast("⚡ Inventario actualizado en tiempo real (-1 par despachado).");
        }
      };
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

      // Registrar pedido B2B en la bodega y descontar inventario en tiempo real
      cart.forEach(item => {
        const prodId = item.productId || item.id;
        db.addB2BOrder({
          storeName: store.name,
          productName: item.name,
          size: item.size,
          colorway: item.colorway,
          units: item.quantity,
          totalWholesale: item.price * item.quantity * 0.65 // aproximación mayorista
        });
        db.decrementStock(prodId, item.colorway, item.size, item.quantity);
      });

      window.open(waUrl, "_blank");
      drawer.classList.remove("open");
      cart = [];
      updateFloatingCartUI();
      showToast("¡Comanda generada! Abriendo WhatsApp directo...");
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
          <td>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; color: var(--text-muted);">$</span>
              <input type="number" class="table-input-price input-wholesale-price" data-prod="${mp.id}" value="${mp.wholesalePrice}" step="5000" style="width: 105px; font-weight: 700; color: var(--text-primary); font-size: 13px;" title="Costo Mayorista Bodega">
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; color: var(--text-muted);">$</span>
              <input type="number" class="table-input-price input-store-price" data-prod="${mp.id}" value="${retailPrice}" step="5000" style="width: 105px; font-weight: 800; color: var(--primary-red); font-size: 13px;">
            </div>
          </td>
          <td>
            <span class="margin-badge ${marginClass}">+${db.formatCOP(margin)}</span>
          </td>
          <td>
            <button type="button" class="btn-action-sm btn-open-stock-modal" data-prod-id="${mp.id}" style="font-size: 11px; padding: 4px 8px; font-weight: 800; color: #15803d; background: #f0fdf4; border-color: #86efac; border-radius: 6px; white-space: nowrap; cursor: pointer;" title="Ver y Editar Stock por Color y Talla">
              📊 ${db.getProductTotalStock(mp.id)} pares
            </button>
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

    // Evento de cálculo en vivo de margen al escribir en costo o precio
    const updateRowMargin = (row) => {
      const wholesaleInput = row.querySelector(".input-wholesale-price");
      const retailInput = row.querySelector(".input-store-price");
      const marginBadge = row.querySelector(".margin-badge");

      if (wholesaleInput && retailInput && marginBadge) {
        const wVal = Number(wholesaleInput.value) || 0;
        const rVal = Number(retailInput.value) || 0;
        const newMargin = rVal - wVal;
        marginBadge.textContent = `${newMargin >= 0 ? '+' : ''}${db.formatCOP(newMargin)}`;
        marginBadge.className = `margin-badge ${newMargin >= 60000 ? 'margin-high' : 'margin-normal'}`;
      }
    };

    tbody.querySelectorAll(".input-wholesale-price, .input-store-price").forEach(input => {
      input.addEventListener("input", () => updateRowMargin(input.closest("tr")));
    });

    // Eventos: Guardar cambios de precios de venta y costos mayoristas
    document.getElementById("btn-save-store-prices").onclick = () => {
      tbody.querySelectorAll(".input-store-price").forEach(input => {
        const prodId = input.dataset.prod;
        const newPrice = Number(input.value);
        db.updateStoreProductPrice(store.id, prodId, newPrice);
      });

      tbody.querySelectorAll(".input-wholesale-price").forEach(wInput => {
        const prodId = wInput.dataset.prod;
        const newWholesale = Number(wInput.value);
        if (!isNaN(newWholesale) && newWholesale > 0) {
          db.updateMasterProduct(prodId, { wholesalePrice: newWholesale });
        }
      });

      showToast("✅ ¡Costos mayoristas y precios de venta guardados con éxito!");
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
              <button type="button" class="btn-action-sm btn-open-stock-modal" data-prod-id="${p.id}" style="font-size: 11px; padding: 4px 8px; font-weight: 800; color: #15803d; background: #f0fdf4; border-color: #86efac; border-radius: 6px; white-space: nowrap; cursor: pointer;" title="Ver y Editar Stock por Color y Talla">
                📊 ${db.getProductTotalStock(p.id)} pares
              </button>
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

    // 2. Tabla de Pedidos B2B con Cambio de Estado en Vivo
    const tbody = document.getElementById("supplier-orders-table");
    if (tbody) {
      tbody.innerHTML = orders.map(ord => `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#${ord.id}</td>
          <td>${ord.date}</td>
          <td style="font-weight: 700; color: var(--text-primary);">${ord.storeName}</td>
          <td>
            <div style="font-weight: 700; font-size: 12px;">${ord.productName}</div>
            <div style="font-size: 10px; color: var(--text-muted);">${ord.colorway || 'Estándar'}</div>
          </td>
          <td><span class="table-size-tag active">${ord.size}</span></td>
          <td style="font-weight: 800;">${ord.units} pares</td>
          <td style="font-weight: 800; color: var(--primary-red);">${db.formatCOP(ord.totalWholesale)}</td>
          <td>
            <select class="form-select order-status-select" data-order-id="${ord.id}" style="font-size: 11px; padding: 4px 6px; font-weight: 700; border-radius: 6px; ${ord.status === 'Entregado y Cobrado' ? 'background: #f0fdf4; color: #16a34a; border-color: #86efac;' : ''}">
              <option value="En Alistamiento" ${ord.status === 'En Alistamiento' ? 'selected' : ''}>📦 En Alistamiento</option>
              <option value="Despachado en Moto" ${ord.status === 'Despachado en Moto' ? 'selected' : ''}>🛵 Despachado en Moto</option>
              <option value="Entregado y Cobrado" ${ord.status === 'Entregado y Cobrado' ? 'selected' : ''}>✅ Entregado y Cobrado</option>
              <option value="Cancelado" ${ord.status === 'Cancelado' ? 'selected' : ''}>❌ Cancelado</option>
            </select>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll(".order-status-select").forEach(sel => {
        sel.addEventListener("change", () => {
          const ordId = sel.dataset.orderId;
          const newStatus = sel.value;
          db.updateOrderStatus(ordId, newStatus);
          showToast(`⚡ Pedido #${ordId} actualizado a: ${newStatus}`);
          renderSupplierAdmin();
        });
      });
    }

    const btnQuickExport = document.querySelector(".btn-quick-export-orders");
    if (btnQuickExport) {
      btnQuickExport.onclick = () => {
        exportOrdersToCSV(db.getOrders(), "Historico_Completo");
      };
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
  let directoryRoleFilter = "all";
  let directorySearchQuery = "";

  function renderDirectory() {
    const allStores = db.getStores();
    const grid = document.getElementById("directory-stores-grid");
    if (!grid) return;

    // Actualizar contadores
    const countAll = allStores.length;
    const countSupplier = allStores.filter(s => s.isSupplierStore).length;
    const countPartner = allStores.filter(s => !s.isSupplierStore).length;

    const elCountAll = document.getElementById("count-all-stores");
    const elCountSup = document.getElementById("count-supplier-stores");
    const elCountPart = document.getElementById("count-partner-stores");
    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountSup) elCountSup.textContent = countSupplier;
    if (elCountPart) elCountPart.textContent = countPartner;

    // Aplicar filtros de rol
    let filtered = allStores;
    if (directoryRoleFilter === "supplier") {
      filtered = filtered.filter(s => s.isSupplierStore);
    } else if (directoryRoleFilter === "partner") {
      filtered = filtered.filter(s => !s.isSupplierStore);
    }

    // Aplicar búsqueda por texto
    if (directorySearchQuery) {
      const q = directorySearchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.neighborhood && s.neighborhood.toLowerCase().includes(q)) ||
        (s.tagline && s.tagline.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary);">No se encontraron vitrinas con ese filtro</h4>
          <p style="font-size: 12px; color: var(--text-secondary);">Prueba cambiando el término de búsqueda o seleccionando "Todos".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(s => {
      const activeCount = s.products.filter(p => p.active).length;
      return `
        <div class="store-directory-card" style="position: relative; overflow: hidden;">
          <!-- Corner Tag Solicitado -->
          <div class="corner-tag ${s.isSupplierStore ? 'corner-tag-supplier' : 'corner-tag-partner'}">
            ${s.isSupplierStore ? '🏢 BODEGA' : '🏪 SNEAKER PARTNER'}
          </div>

          <div style="margin-bottom: 8px;">
            <span class="badge-verified" style="${s.isSupplierStore ? 'background: #fef2f2; color: #dc2626; border-color: #fca5a5;' : 'background: #eff6ff; color: #2563eb; border-color: #bfdbfe;'} font-size: 10px; font-weight: 800;">
              ${s.isSupplierStore ? '🏢 BODEGA MATRIZ (CLIENTE DIRECTO SAAS)' : '🏪 SNEAKER PARTNER (REVENDEDOR AFILIADO)'}
            </span>
          </div>
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

  function setupDirectoryFilters() {
    const filterButtons = document.querySelectorAll(".btn-filter-role");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        directoryRoleFilter = btn.dataset.filter;
        renderDirectory();
      });
    });

    const searchInput = document.getElementById("dir-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        directorySearchQuery = e.target.value.trim();
        renderDirectory();
      });
    }
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
  // COTIZADOR PERSONALIZADO VIP (DESCUENTOS EXCLUSIVOS & CLIENTES ANTIGUOS)
  // =========================================================================
  function setupQuoteGenerator() {
    const modal = document.getElementById("modal-quote-generator");
    const previewModal = document.getElementById("modal-quote-preview");
    const btnOpenSupplier = document.getElementById("btn-open-quote-modal");
    const btnOpenPartner = document.getElementById("btn-open-quote-modal-partner");
    const btnClose = document.getElementById("btn-close-quote-modal");
    const btnClosePreview = document.getElementById("btn-close-preview-modal");
    const btnClosePreviewBtn = document.getElementById("btn-close-preview-btn");

    if (!modal) return;

    let quoteItems = [];

    // Apertura y Cierre
    const openModal = () => {
      populateProductSelect();
      if (quoteItems.length === 0) {
        const prods = db.getMasterProducts(false);
        if (prods.length >= 2) {
          quoteItems = [
            { id: prods[0].id, name: prods[0].name, sku: prods[0].sku, size: 37, price: prods[0].suggestedRetailPrice, qty: 1, image: prods[0].image },
            { id: prods[1].id, name: prods[1].name, sku: prods[1].sku, size: 41, price: prods[1].suggestedRetailPrice, qty: 1, image: prods[1].image }
          ];
        }
      }
      renderQuoteItems();
      modal.classList.add("open");
    };

    if (btnOpenSupplier) btnOpenSupplier.onclick = openModal;
    if (btnOpenPartner) btnOpenPartner.onclick = openModal;
    if (btnClose) btnClose.onclick = () => modal.classList.remove("open");
    if (btnClosePreview) btnClosePreview.onclick = () => previewModal.classList.remove("open");
    if (btnClosePreviewBtn) btnClosePreviewBtn.onclick = () => previewModal.classList.remove("open");

    // Llenar selector de productos
    function populateProductSelect() {
      const select = document.getElementById("quote-prod-select");
      if (!select) return;
      const prods = db.getMasterProducts(false);
      select.innerHTML = prods.map(p => `
        <option value="${p.id}" data-price="${p.suggestedRetailPrice}">
          ${p.name} — ${db.formatCOP(p.suggestedRetailPrice)}
        </option>
      `).join("");
    }

    // Renderizar items y recalcular
    function renderQuoteItems() {
      const container = document.getElementById("quote-items-list");
      if (!container) return;

      if (quoteItems.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 14px;">No hay pares agregados aún. Selecciona arriba y pulsa "Agregar".</div>`;
      } else {
        container.innerHTML = quoteItems.map((item, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--border-subtle); font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 800; color: var(--primary-red);">${item.qty}x</span>
              <div>
                <strong style="color: var(--text-primary); font-size: 12px;">${item.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted); margin-left: 4px;">(Talla ${item.size})</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: var(--text-primary);">${db.formatCOP(item.price * item.qty)}</span>
              <button type="button" class="btn-remove-quote-item" data-idx="${idx}" style="background: none; border: none; color: #ef4444; font-size: 13px; cursor: pointer; padding: 0 4px;" title="Quitar">✕</button>
            </div>
          </div>
        `).join("");

        container.querySelectorAll(".btn-remove-quote-item").forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx, 10);
            quoteItems.splice(idx, 1);
            renderQuoteItems();
          };
        });
      }

      recalculateTotals();
    }

    // Agregar Item
    const btnAdd = document.getElementById("btn-add-quote-item");
    if (btnAdd) {
      btnAdd.onclick = () => {
        const prodSelect = document.getElementById("quote-prod-select");
        const sizeSelect = document.getElementById("quote-size-select");
        const qtyInput = document.getElementById("quote-qty-input");

        const prodId = prodSelect.value;
        const prods = db.getMasterProducts(false);
        const prod = prods.find(p => p.id === prodId);
        if (!prod) return;

        const size = parseInt(sizeSelect.value, 10);
        const qty = parseInt(qtyInput.value, 10) || 1;

        quoteItems.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          size,
          price: prod.suggestedRetailPrice,
          qty,
          image: prod.image
        });

        renderQuoteItems();
        showToast(`Agregado: ${qty}x ${prod.name} (Talla ${size})`);
      };
    }

    // Recalcular Totales en Tiempo Real
    function recalculateTotals() {
      const subtotal = quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0);
      const discount = Number(document.getElementById("quote-discount-amount")?.value) || 0;
      const shipping = Number(document.getElementById("quote-shipping-select")?.value) || 0;
      const reason = document.getElementById("quote-discount-reason")?.value.trim() || "Descuento Especial";

      const total = Math.max(0, subtotal - discount + shipping);

      const subtotalEl = document.getElementById("quote-subtotal-display");
      const discountEl = document.getElementById("quote-discount-display");
      const discountLabelEl = document.getElementById("quote-discount-label");
      const shippingEl = document.getElementById("quote-shipping-display");
      const totalEl = document.getElementById("quote-total-display");

      if (subtotalEl) subtotalEl.textContent = db.formatCOP(subtotal) + " COP";
      if (discountEl) discountEl.textContent = `-${db.formatCOP(discount)} COP`;
      if (discountLabelEl) discountLabelEl.textContent = `Descuento Especial (${reason}):`;
      if (shippingEl) shippingEl.textContent = shipping === 0 ? "¡GRATIS! (Cortesía)" : db.formatCOP(shipping) + " COP";
      if (totalEl) totalEl.textContent = db.formatCOP(total) + " COP";

      return { subtotal, discount, shipping, total, reason };
    }

    // Escuchadores de inputs de descuento y flete
    ["quote-discount-amount", "quote-discount-reason", "quote-shipping-select"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", recalculateTotals);
      if (el) el.addEventListener("change", recalculateTotals);
    });

    // Generar Mensaje de WhatsApp
    function generateWhatsAppMessage() {
      const clientName = document.getElementById("quote-client-name")?.value.trim() || "Cliente VIP";
      const store = db.getCurrentStore();
      const { subtotal, discount, shipping, total, reason } = recalculateTotals();
      const validity = document.getElementById("quote-validity-select")?.value || "48 Horas";
      const quoteNum = Math.floor(1000 + Math.random() * 9000);

      const itemsText = quoteItems.map(it => 
        `• *${it.qty}x ${it.name}*\n  - Talla: ${it.size} | Ref: ${it.sku}\n  - Precio Regular: ${db.formatCOP(it.price * it.qty)} COP`
      ).join("\n\n");

      return `📋 *COTIZACIÓN ESPECIAL PERSONALIZADA*
🏢 *${store.name}*
📍 *Ubicación:* ${store.neighborhood}
📅 *Fecha:* ${new Date().toLocaleDateString('es-CO')} | *Cotización #COT-${quoteNum}*
👤 *Cliente VIP:* ${clientName}

👟 *CALZADO SELECCIONADO EN ESTA PROPUESTA:*
${itemsText}

-------------------------------------------
💵 *Subtotal Regular:* ${db.formatCOP(subtotal)} COP
🎁 *${reason}:* -${db.formatCOP(discount)} COP
🛵 *Flete Domicilio Cali:* ${shipping === 0 ? 'GRATIS (Cortesía Bodega)' : db.formatCOP(shipping) + ' COP'}
-------------------------------------------
⭐ *TOTAL FINAL A PAGAR: ${db.formatCOP(total)} COP*
-------------------------------------------
⏱️ *Vigencia:* Propuesta reservada ${validity}.
📦 *Despacho:* Entrega hoy mismo con motorizado en Cali o despacho nacional asegurado.

💬 *Para confirmar tu pedido con este precio especial, por favor respóndeme con un "CONFIRMO PEDIDO" y tu dirección exacta.*`;
    }

    // Enviar WhatsApp
    const btnSendWA = document.getElementById("btn-send-quote-wa");
    if (btnSendWA) {
      btnSendWA.onclick = () => {
        if (quoteItems.length === 0) {
          alert("Agrega al menos un par de calzado a la cotización.");
          return;
        }
        const msg = generateWhatsAppMessage();
        const clientPhone = (document.getElementById("quote-client-phone")?.value || "").replace(/\D/g, "");
        const targetPhone = clientPhone.length >= 10 ? (clientPhone.startsWith("57") ? clientPhone : "57" + clientPhone) : db.getNextWhatsAppLine(db.getCurrentStore());
        const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
        showToast("📲 Abriendo WhatsApp con la cotización formateada...");
      };
    }

    // Copiar Texto
    const btnCopy = document.getElementById("btn-copy-quote-text");
    if (btnCopy) {
      btnCopy.onclick = () => {
        if (quoteItems.length === 0) {
          alert("Agrega al menos un par de calzado a la cotización.");
          return;
        }
        const msg = generateWhatsAppMessage();
        navigator.clipboard?.writeText(msg).then(() => {
          showToast("📋 ¡Cotización formal copiada al portapapeles!");
        }).catch(() => {
          prompt("Copia el texto de la cotización:", msg);
        });
      };
    }

    // Ver Ficha Formal Imprimible / Digital
    const btnPreview = document.getElementById("btn-preview-quote-card");
    if (btnPreview) {
      btnPreview.onclick = () => {
        if (quoteItems.length === 0) {
          alert("Agrega al menos un par de calzado a la cotización.");
          return;
        }
        const clientName = document.getElementById("quote-client-name")?.value.trim() || "Cliente VIP";
        const store = db.getCurrentStore();
        const { subtotal, discount, shipping, total, reason } = recalculateTotals();
        const validity = document.getElementById("quote-validity-select")?.value || "48 Horas";
        const quoteNum = Math.floor(1000 + Math.random() * 9000);

        const rowsHtml = quoteItems.map(it => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px;">
              <strong style="color: #0f172a; font-size: 12px;">${it.name}</strong><br>
              <span style="color: #64748b; font-size: 10px;">SKU: ${it.sku}</span>
            </td>
            <td style="padding: 8px 6px; text-align: center;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 11px;">${it.size}</span></td>
            <td style="padding: 8px 6px; text-align: center; font-weight: 700;">${it.qty}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 700;">${db.formatCOP(it.price)}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 800; color: #0f172a;">${db.formatCOP(it.price * it.qty)}</td>
          </tr>
        `).join("");

        const previewContainer = document.getElementById("printable-quote-content");
        if (previewContainer) {
          previewContainer.innerHTML = `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Header Membretado -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e6192e; padding-bottom: 14px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="assets/images/sneaker_world_logo_transparent.png" alt="Logo" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #e6192e;">
                  <div>
                    <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a;">${store.name}</h2>
                    <div style="font-size: 11px; color: #64748b;">${store.neighborhood}</div>
                    <div style="font-size: 11px; color: #64748b;">WhatsApp Oficial: +${store.phone}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 10px; font-weight: 800; background: #fff0f1; color: #e6192e; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(230,25,46,0.2);">PROPUESTA COMERCIAL VIP</span>
                  <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 4px;">#COT-${quoteNum}</div>
                  <div style="font-size: 10px; color: #64748b;">${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
              </div>

              <!-- Info Cliente VIP -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Dirigido A:</span>
                  <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${clientName}</div>
                </div>
                <div>
                  <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Validez de la Oferta:</span>
                  <div style="font-size: 12px; font-weight: 800; color: #e6192e;">⏱️ ${validity}</div>
                </div>
              </div>

              <!-- Tabla de Productos -->
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 10px;">
                    <th style="padding: 6px; text-align: left;">Modelo</th>
                    <th style="padding: 6px; text-align: center;">Talla</th>
                    <th style="padding: 6px; text-align: center;">Cant.</th>
                    <th style="padding: 6px; text-align: right;">Unitario</th>
                    <th style="padding: 6px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <!-- Resumen Financiero -->
              <div style="margin-left: auto; width: 260px; font-size: 12px; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; color: #64748b;">
                  <span>Subtotal Regular:</span>
                  <strong style="color: #0f172a;">${db.formatCOP(subtotal)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 700;">
                  <span>${reason}:</span>
                  <span>-${db.formatCOP(discount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: #64748b;">
                  <span>Flete Domicilio:</span>
                  <strong style="color: #0f172a;">${shipping === 0 ? 'GRATIS' : db.formatCOP(shipping)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #e6192e; border-top: 2px solid #0f172a; padding-top: 6px; margin-top: 4px;">
                  <span>TOTAL A PAGAR:</span>
                  <span>${db.formatCOP(total)}</span>
                </div>
              </div>

              <!-- Pie de Cotización y Watermark -->
              <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
                <div>✨ Despachos asegurados en moto en Cali & Envíos Nacionales Interrapidísimo / Envía.</div>
                <div style="font-weight: 800; color: #0f172a;">Engineered by <strong>BASTION AI</strong></div>
              </div>
            </div>
          `;
        }

        previewModal.classList.add("open");
      };
    }
  }

  // =========================================================================
  // CONTROL DE INVENTARIO Y STOCK EN TIEMPO REAL (POR COLOR Y TALLA)
  // =========================================================================
  function setupInventoryStockMatrix() {
    const modal = document.getElementById("modal-inventory-matrix");
    const btnClose = document.getElementById("btn-close-stock-modal");
    const btnCancel = document.getElementById("btn-cancel-stock-modal");
    const btnSave = document.getElementById("btn-save-stock-matrix");
    const btnQuickAdd = document.getElementById("btn-stock-quick-add-all");
    const btnQuickClear = document.getElementById("btn-stock-quick-clear-all");

    if (!modal) return;

    let currentProdId = null;

    // Delegación para abrir modal desde cualquier tabla
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-open-stock-modal");
      if (!btn) return;

      const prodId = btn.dataset.prodId;
      openStockMatrixModal(prodId);
    });

    if (btnClose) btnClose.onclick = () => modal.classList.remove("open");
    if (btnCancel) btnCancel.onclick = () => modal.classList.remove("open");

    function openStockMatrixModal(productId) {
      currentProdId = productId;
      const products = db.getMasterProducts(false);
      const prod = products.find(p => p.id === productId);
      if (!prod) return;

      document.getElementById("matrix-prod-img").src = prod.image;
      document.getElementById("matrix-prod-name").textContent = prod.name;
      document.getElementById("matrix-prod-sku").textContent = `SKU: ${prod.sku} • ${prod.category}`;

      renderMatrixTable(prod);
      modal.classList.add("open");
    }

    function renderMatrixTable(prod) {
      const table = document.getElementById("matrix-stock-table");
      const matrix = db.getProductStockMatrix(prod.id);
      const colorways = prod.colorways && prod.colorways.length > 0 ? prod.colorways : [{ name: "Estándar", image: prod.image }];
      const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : [36, 37, 38, 39, 40, 41, 42];

      const headerCells = sizes.map(sz => `<th style="text-align: center; padding: 8px 6px;">Talla ${sz}</th>`).join("");
      
      const rowsHtml = colorways.map(cw => {
        const rowCells = sizes.map(sz => {
          const key = `${cw.name}_${sz}`;
          const val = matrix[key] !== undefined ? matrix[key] : 5;
          return `
            <td style="text-align: center; padding: 6px 4px;">
              <input type="number" min="0" max="999" class="form-input matrix-cell-input" 
                     data-color="${cw.name}" data-size="${sz}" value="${val}" 
                     style="width: 58px; text-align: center; padding: 4px 2px; font-weight: 800; font-size: 13px;">
            </td>
          `;
        }).join("");

        const rowTotal = sizes.reduce((acc, sz) => acc + (Number(matrix[`${cw.name}_${sz}`]) || 0), 0);

        return `
          <tr>
            <td style="padding: 8px 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${cw.image || prod.image}" alt="${cw.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">
                <div>
                  <strong style="font-size: 12px; color: var(--text-primary);">${cw.name}</strong>
                  <div style="font-size: 10px; color: var(--text-muted);">${cw.sku || prod.sku}</div>
                </div>
              </div>
            </td>
            ${rowCells}
            <td style="text-align: center; padding: 8px 6px; font-weight: 800; color: var(--primary-red);" class="matrix-color-row-total">
              ${rowTotal} pares
            </td>
          </tr>
        `;
      }).join("");

      table.innerHTML = `
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px 10px; text-align: left;">Colorway / Edición</th>
            ${headerCells}
            <th style="text-align: center; padding: 8px 6px;">Total Color</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      `;

      updateGrandTotalBadge();

      // Listener de inputs para recalcular en vivo
      table.querySelectorAll(".matrix-cell-input").forEach(input => {
        input.addEventListener("input", () => {
          updateGrandTotalBadge();
        });
      });
    }

    function updateGrandTotalBadge() {
      const inputs = document.querySelectorAll("#matrix-stock-table .matrix-cell-input");
      let grandTotal = 0;
      inputs.forEach(inp => {
        grandTotal += (parseInt(inp.value, 10) || 0);
      });
      document.getElementById("matrix-grand-total-badge").textContent = `${grandTotal} pares`;
    }

    if (btnQuickAdd) {
      btnQuickAdd.onclick = () => {
        document.querySelectorAll("#matrix-stock-table .matrix-cell-input").forEach(inp => {
          inp.value = (parseInt(inp.value, 10) || 0) + 5;
        });
        updateGrandTotalBadge();
        showToast("➕ Curva de +5 pares agregada a cada talla.");
      };
    }

    if (btnQuickClear) {
      btnQuickClear.onclick = () => {
        if (confirm("¿Seguro que deseas poner en 0 el stock de este modelo?")) {
          document.querySelectorAll("#matrix-stock-table .matrix-cell-input").forEach(inp => {
            inp.value = 0;
          });
          updateGrandTotalBadge();
        }
      };
    }

    if (btnSave) {
      btnSave.onclick = () => {
        if (!currentProdId) return;

        const newMatrix = {};
        document.querySelectorAll("#matrix-stock-table .matrix-cell-input").forEach(inp => {
          const color = inp.dataset.color;
          const size = inp.dataset.size;
          const val = Math.max(0, parseInt(inp.value, 10) || 0);
          newMatrix[`${color}_${size}`] = val;
        });

        db.saveProductStockMatrix(currentProdId, newMatrix);
        const grandTotal = Object.values(newMatrix).reduce((a, b) => a + b, 0);

        modal.classList.remove("open");
        showToast(`✅ Stock guardado: ${grandTotal} pares registrados en bodega.`);

        // Refrescar vistas para actualizar los badges
        renderSupplierAdmin();
        renderStoreAdmin(db.getCurrentStore());
      };
    }
  }

  // =========================================================================
  // CENTRO DE REPORTES CONTABLES, FACTURACIÓN & EXPORTACIÓN EXCEL / PDF
  // =========================================================================
  function setupAccountingReports() {
    const modal = document.getElementById("modal-accounting-reports");
    const btnOpenSupplier = document.getElementById("btn-open-supplier-reports");
    const btnOpenStore = document.getElementById("btn-open-store-reports");
    const btnClose = document.getElementById("btn-close-reports-modal");
    const periodButtons = document.querySelectorAll(".btn-report-period");
    const btnExportExcel = document.getElementById("btn-export-reports-excel");
    const btnExportPdf = document.getElementById("btn-export-reports-pdf");

    if (!modal) return;

    let activePeriod = "month";
    let activeStoreFilter = null; // null = consolidado bodega / red completa

    function openReports(storeFilter = null) {
      activeStoreFilter = storeFilter;
      const headerTitle = document.getElementById("reports-modal-header-title");
      if (headerTitle) {
        headerTitle.textContent = storeFilter 
          ? `Reporte Contable — ${storeFilter}` 
          : `Centro Contable & Liquidación Financiera (Red Cali)`;
      }
      renderReportData();
      modal.classList.add("open");
    }

    if (btnOpenSupplier) {
      btnOpenSupplier.onclick = () => openReports(null);
    }
    if (btnOpenStore) {
      btnOpenStore.onclick = () => {
        const store = db.getCurrentStore();
        openReports(store.isSupplierStore ? null : store.name);
      };
    }
    if (btnClose) {
      btnClose.onclick = () => modal.classList.remove("open");
    }

    periodButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        periodButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activePeriod = btn.dataset.period;
        renderReportData();
      });
    });

    function renderReportData() {
      const summary = db.getFinancialSummary(activePeriod, activeStoreFilter);
      
      const periodLabels = {
        day: "Hoy (24 Horas)",
        week: "Últimos 7 Días",
        month: "Mes en Curso (30 Días)",
        year: "Acumulado Anual / Histórico"
      };
      const labelEl = document.getElementById("reports-date-range-label");
      if (labelEl) {
        labelEl.innerHTML = `Periodo Seleccionado: <strong>${periodLabels[activePeriod] || activePeriod}</strong>`;
      }

      document.getElementById("report-kpi-gross-sales").textContent = db.formatCOP(summary.totalGross);
      document.getElementById("report-kpi-wholesale-cost").textContent = db.formatCOP(summary.totalWholesale);
      document.getElementById("report-kpi-net-profit").textContent = db.formatCOP(summary.netProfit);
      document.getElementById("report-kpi-pairs-count").textContent = `${summary.totalPairs} pares (${summary.totalOrders} pedidos)`;

      const tbody = document.getElementById("report-orders-tbody");
      if (tbody) {
        if (summary.orders.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">
                No hay transacciones registradas en este período.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = summary.orders.map(o => {
          const wholesale = Number(o.totalWholesale) || 0;
          const retail = Number(o.totalRetail) || (wholesale * 1.55);
          const margin = retail - wholesale;
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#${o.id}</td>
              <td style="color: var(--text-muted);">${o.date}</td>
              <td style="font-weight: 700;">${o.storeName}</td>
              <td>${o.productName} <span style="font-size: 10px; color: var(--text-muted);">(${o.size})</span></td>
              <td style="text-align: center; font-weight: 800;">${o.units}</td>
              <td style="font-weight: 700;">${db.formatCOP(retail)}</td>
              <td style="font-weight: 700; color: #b45309;">${db.formatCOP(wholesale)}</td>
              <td style="font-weight: 800; color: #15803d;">+${db.formatCOP(margin)}</td>
              <td>
                <span class="badge-verified" style="${o.status === 'Entregado y Cobrado' ? 'background: #f0fdf4; color: #16a34a; border-color: #86efac;' : 'background: #f8fafc; color: #64748b;'} font-size: 10px;">
                  ${o.status || 'En Alistamiento'}
                </span>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    // Exportar a Excel (CSV)
    if (btnExportExcel) {
      btnExportExcel.onclick = () => {
        const summary = db.getFinancialSummary(activePeriod, activeStoreFilter);
        exportOrdersToCSV(summary.orders, activePeriod);
      };
    }

    // Exportar a PDF / Impresión Ejecutiva
    if (btnExportPdf) {
      btnExportPdf.onclick = () => {
        const summary = db.getFinancialSummary(activePeriod, activeStoreFilter);
        generatePDFReport(summary, activePeriod, activeStoreFilter);
      };
    }
  }

  function exportOrdersToCSV(orders, periodName) {
    if (!orders || orders.length === 0) {
      showToast("No hay órdenes registradas para exportar.");
      return;
    }

    const bom = "\uFEFF";
    const headers = [
      "ID Orden",
      "Fecha y Hora",
      "Tienda / Sneaker Partner",
      "Referencia / Modelo",
      "Colorway",
      "Talla",
      "Pares",
      "Precio Venta Sugerido",
      "Costo Mayorista Bodega",
      "Utilidad Neta Generada",
      "Estado Despacho",
      "Bodega Despachadora"
    ];

    const rows = orders.map(o => {
      const wholesale = Number(o.totalWholesale) || 0;
      const retail = Number(o.totalRetail) || (wholesale * 1.55);
      const margin = retail - wholesale;

      return [
        `"#${o.id}"`,
        `"${o.date}"`,
        `"${o.storeName}"`,
        `"${o.productName}"`,
        `"${o.colorway || 'Estándar'}"`,
        `"${o.size}"`,
        o.units,
        retail,
        wholesale,
        margin,
        `"${o.status || 'En Alistamiento'}"`,
        `"${o.supplierName || 'Vanessa Castellar Shoes'}"`
      ].join(";");
    });

    const csvContent = bom + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Contable_SneakerWorld_${periodName}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 ¡Archivo Excel (.CSV) descargado con éxito!");
  }

  function generatePDFReport(summary, periodName, storeFilter) {
    const periodTitles = {
      day: "INFORME DIARIO DE VENTAS Y DESPACHOS",
      week: "INFORME SEMANAL DE LIQUIDACIÓN COMERCIAL",
      month: "INFORME MENSUAL DE RESULTADOS & UTILIDADES",
      year: "INFORME CONSOLIDADO HISTÓRICO Y ANUAL"
    };

    const title = periodTitles[periodName] || "INFORME CONTABLE";
    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const rowsHtml = summary.orders.map(o => {
      const wholesale = Number(o.totalWholesale) || 0;
      const retail = Number(o.totalRetail) || (wholesale * 1.55);
      const margin = retail - wholesale;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; font-weight: bold; color: #b91c1c;">#${o.id}</td>
          <td style="padding: 6px 8px; color: #64748b;">${o.date}</td>
          <td style="padding: 6px 8px; font-weight: 600;">${o.storeName}</td>
          <td style="padding: 6px 8px;">${o.productName} (Talla ${o.size})</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${o.units}</td>
          <td style="padding: 6px 8px; text-align: right;">${db.formatCOP(retail)}</td>
          <td style="padding: 6px 8px; text-align: right; color: #b45309;">${db.formatCOP(wholesale)}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #15803d;">+${db.formatCOP(margin)}</td>
          <td style="padding: 6px 8px; text-align: center;">${o.status || 'En Alistamiento'}</td>
        </tr>
      `;
    }).join("");

    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para generar el PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte Contable - SNEAKER WORLD MLS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .kpi-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .kpi-val { font-size: 16px; font-weight: 900; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #0f172a; color: #ffffff; font-size: 10px; text-align: left; padding: 8px; text-transform: uppercase; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
          @media print {
            .no-print { display: none !important; }
            body { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Imprimir / Guardar como PDF
          </button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">
            Cerrar
          </button>
        </div>

        <div class="header">
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #e6192e; letter-spacing: 1px;">SNEAKER WORLD MLS • BASTION AI</div>
            <h1 class="title">${title}</h1>
            <div class="subtitle">${storeFilter ? 'Entidad: <strong>' + storeFilter + '</strong>' : 'Consolidado Red Cali (Bodega Vanessa Castellar & Partners)'}</div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div>Fecha de Emisión: <strong>${formattedDate}</strong></div>
            <div style="color: #16a34a; font-weight: bold; margin-top: 2px;">🟢 Estado: Contabilidad Validada</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card" style="border-left: 4px solid #2563eb;">
            <div class="kpi-label">Facturación Bruta</div>
            <div class="kpi-val" style="color: #1e3a8a;">${db.formatCOP(summary.totalGross)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
            <div class="kpi-label">Costo Bodega Mayorista</div>
            <div class="kpi-val" style="color: #b45309;">${db.formatCOP(summary.totalWholesale)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #16a34a;">
            <div class="kpi-label">Utilidad Neta Red</div>
            <div class="kpi-val" style="color: #15803d;">${db.formatCOP(summary.netProfit)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #e6192e;">
            <div class="kpi-label">Pares Despachados</div>
            <div class="kpi-val" style="color: #e6192e;">${summary.totalPairs} pares</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tienda / Partner</th>
              <th>Referencia</th>
              <th style="text-align: center;">Pares</th>
              <th style="text-align: right;">Venta</th>
              <th style="text-align: right;">Costo Bodega</th>
              <th style="text-align: right;">Utilidad</th>
              <th style="text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Documento auditado por el motor contable de <strong>BASTION AI</strong> — San Andresito de la 38, Cali, Colombia.</div>
          <div>Página 1 de 1</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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
