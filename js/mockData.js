// Base de datos oficial - Catálogo Maestro SNEAKER WORLD MLS Cali (Bastion AI)
// 18 Referencias reales ordenadas exactamente según la vitrina matriz de Vanessa Castellar Shoes
// Con las 10 líneas oficiales de atención de Vanessa Castellar

const VANESSA_WHATSAPP_LINES = [
  { id: "line-1", phone: "573505337256", name: "Línea 1 - Vanessa Directo", active: true },
  { id: "line-2", phone: "573505292624", name: "Línea 2 - Asesoría Cali", active: true },
  { id: "line-3", phone: "573505332700", name: "Línea 3 - Mayoristas Nacional", active: true },
  { id: "line-4", phone: "573505292805", name: "Línea 4 - Despachos Hoy", active: true },
  { id: "line-5", phone: "573505333793", name: "Línea 5 - Contraentrega", active: true },
  { id: "line-6", phone: "573505292964", name: "Línea 6 - Reposiciones B2B", active: true },
  { id: "line-7", phone: "573505341713", name: "Línea 7 - Alistamiento Bodega", active: true },
  { id: "line-8", phone: "573505340375", name: "Línea 8 - Pedidos Rápidos", active: true },
  { id: "line-9", phone: "573505332728", name: "Línea 9 - Atención Satélites", active: true },
  { id: "line-10", phone: "573505332595", name: "Línea 10 - Garantías & Envíos", active: true }
];

const INITIAL_MASTER_PRODUCTS = [
  // 1. Nike Initiator Retro Runner Dama (Baby Blue)
  {
    id: "prod-snk-001",
    sku: "NK-INIT-BLU",
    name: "Nike Initiator Retro Runner Dama",
    category: "Running & Tech",
    tagline: "Silueta retro runner Y2K ultra liviana con malla transpirable celeste pastel.",
    description: "Inspirada en el estilo running de los 2000s. Capellada de malla transpirable con refuerzos metálicos y entresuela de espuma suave para amortiguación diaria.",
    image: "assets/images/nike_initiator_babyblue.jpg",
    colorways: [
      { name: "Baby Blue Pastel", image: "assets/images/nike_initiator_babyblue.jpg", sku: "NK-INIT-BLU" },
      { name: "Bone Mocha Beige", image: "assets/images/nike_initiator_bone_mocha.jpg", sku: "NK-INIT-MOC" },
      { name: "White Blue Metallic", image: "assets/images/nike_initiator_white_blue.jpg", sku: "NK-INIT-WHTBLU" }
    ],
    wholesalePrice: 115000,
    suggestedRetailPrice: 185000,
    sizes: [35, 36, 37, 38, 39, 40],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 2. Nike Air Zoom Pegasus Structure
  {
    id: "prod-snk-002",
    sku: "NK-ZOOM-RED",
    name: "Nike Air Zoom Pegasus Structure",
    category: "Running & Tech",
    tagline: "Cápsula Zoom Air presurizada para respuesta instantánea en entrenamiento diario.",
    description: "Malla Engineered Mesh transpirable con soporte dinámico en el mediopié y entresuela de espuma React suave con cápsula Zoom Air.",
    image: "assets/images/nike_airzoom_white_red.jpg",
    colorways: [
      { name: "White / Red Rush", image: "assets/images/nike_airzoom_white_red.jpg", sku: "NK-ZOOM-RED" },
      { name: "Black / White Classic", image: "assets/images/nike_airzoom_black_white.jpg", sku: "NK-ZOOM-BLK" }
    ],
    wholesalePrice: 120000,
    suggestedRetailPrice: 200000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 3. On Cloud 5 Everyday Comfort
  {
    id: "prod-snk-003",
    sku: "ON-C5-GRY",
    name: "On Cloud 5 Everyday Comfort",
    category: "Running & Tech",
    tagline: "El ícono suizo favorito de uso diario con sistema de atado rápido 'speed-lacing'.",
    description: "Amortiguación ultraligera CloudTec® en espuma Zero-Gravity. Ajuste anatómico moldeado y membrana transpirable para uso urbano prolongado.",
    image: "assets/images/on_cloud5_grey_cream.jpg",
    colorways: [
      { name: "Grey / Cream Neutral", image: "assets/images/on_cloud5_grey_cream.jpg", sku: "ON-C5-GRY" },
      { name: "All White Pure", image: "assets/images/on_cloud5_all_white.jpg", sku: "ON-C5-WHT" }
    ],
    wholesalePrice: 140000,
    suggestedRetailPrice: 220000,
    sizes: [36, 37, 38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 4. On Cloudmonster Swiss Engineering (Olive)
  {
    id: "prod-snk-004",
    sku: "ON-MONSTER-OLV",
    name: "On Cloudmonster Swiss Engineering",
    category: "Running & Tech",
    tagline: "Máxima amortiguación CloudTec® con retorno de energía explosivo para asfalto y gym.",
    description: "Equipada con los elementos Cloud más grandes de la historia de On, combinados con la placa Speedboard® de propulsión y superespuma Helion™.",
    image: "assets/images/on_cloudmonster_olive.jpg",
    colorways: [
      { name: "Olive Aloe Green", image: "assets/images/on_cloudmonster_olive.jpg", sku: "ON-MONSTER-OLV" },
      { name: "Mint Lime Accent", image: "assets/images/on_cloudmonster_mint.jpg", sku: "ON-MONSTER-MNT" }
    ],
    wholesalePrice: 145000,
    suggestedRetailPrice: 235000,
    sizes: [38, 39, 40, 41, 42, 43, 44],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 5. Air Jordan 4 Retro 'Military Black'
  {
    id: "prod-snk-005",
    sku: "AJ4-MIL-BLK",
    name: "Air Jordan 4 Retro 'Military Black'",
    category: "Urbano Retro",
    tagline: "El clásico más codiciado en cuero blanco premium con detalles en gris ante y negro mate.",
    description: "Construcción en cuero suave blanco con puntera en gamuza gris claro y acentos en negro mate en los ojales 'wings', talón y entresuela Air-Sole visible.",
    image: "assets/images/jordan_4_military_black.jpg",
    colorways: [
      { name: "Military Black Clásico", image: "assets/images/jordan_4_military_black.jpg", sku: "AJ4-MIL-BLK" }
    ],
    wholesalePrice: 155000,
    suggestedRetailPrice: 250000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 6. Air Jordan 1 Mid 'Canyon Rust'
  {
    id: "prod-snk-006",
    sku: "AJ1-CYN-RST",
    name: "Air Jordan 1 Mid 'Canyon Rust'",
    category: "Urbano Retro",
    tagline: "Mezcla terrosa premium en tonos terracota, rosa empolvado y nobuck envejecido.",
    description: "Combinación de ante aterciopelado, nobuck y lona suave en tonos óxido y negro descolorido con Swoosh texturizado en tono denim.",
    image: "assets/images/jordan_1_canyon_rust.jpg",
    colorways: [
      { name: "Canyon Rust / Terracota", image: "assets/images/jordan_1_canyon_rust.jpg", sku: "AJ1-CYN-RST" }
    ],
    wholesalePrice: 140000,
    suggestedRetailPrice: 230000,
    sizes: [36, 37, 38, 39, 40, 41],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 7. Nike Dunk Low x Initial D 'AE86 Tofu Shop'
  {
    id: "prod-snk-007",
    sku: "NK-DUNK-INITD",
    name: "Nike Dunk Low x Initial D 'AE86 Tofu Shop'",
    category: "Skate & Casual",
    tagline: "Edición especial tributo al legendario Toyota Sprinter Trueno AE86 de Takumi Fujiwara.",
    description: "Cuero blanco y negro mate de alto gramaje con caligrafía japonesa en el lateral, placa morada en el talón que emula la matrícula japonesa y suela bitono.",
    image: "assets/images/nike_dunk_initial_d.jpg",
    colorways: [
      { name: "Panda AE86 Edition", image: "assets/images/nike_dunk_initial_d.jpg", sku: "NK-DUNK-INITD" }
    ],
    wholesalePrice: 135000,
    suggestedRetailPrice: 215000,
    sizes: [37, 38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 8. Nike Air Force 1 Low 'Valentine Love Pink'
  {
    id: "prod-snk-008",
    sku: "AF1-VAL-PNK",
    name: "Nike Air Force 1 Low 'Valentine Love Pink'",
    category: "Skate & Casual",
    tagline: "Edición romántica con detalles en rosa cereza y corazones perforados en la puntera.",
    description: "Cuero blanco impoluto con Swoosh lateral en rosa intenso, bordados conmemorativos y suela cosida reforzada de alta resistencia.",
    image: "assets/images/af1_valentine_pink.jpg",
    colorways: [
      { name: "Pink Valentine Love", image: "assets/images/af1_valentine_pink.jpg", sku: "AF1-VAL-PNK" }
    ],
    wholesalePrice: 120000,
    suggestedRetailPrice: 195000,
    sizes: [35, 36, 37, 38, 39],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 9. Adidas Samba OG Corduroy 'Velvet Sand'
  {
    id: "prod-snk-009",
    sku: "ADI-SAMBA-CRD",
    name: "Adidas Samba OG Corduroy 'Velvet Sand'",
    category: "Skate & Casual",
    tagline: "El clásico terrace reinventado con paneles de pana suave (corduroy) y suela de goma caramelo.",
    description: "Textura acanalada de pana en color marfil con las 3 rayas en cuero marrón chocolate y la clásica puntera en T en gamuza tonal. Suela plana gumsole.",
    image: "assets/images/adidas_samba_corduroy.jpg",
    colorways: [
      { name: "Corduroy Cream / Brown", image: "assets/images/adidas_samba_corduroy.jpg", sku: "ADI-SAMBA-CRD" }
    ],
    wholesalePrice: 130000,
    suggestedRetailPrice: 210000,
    sizes: [36, 37, 38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 10. Adidas Adizero Pro Navy Marathon
  {
    id: "prod-snk-010",
    sku: "ADI-ADIZ-NVY",
    name: "Adidas Adizero Pro Navy Marathon",
    category: "Running & Tech",
    tagline: "Diseñado para velocidad y media maratón con amortiguación Lightstrike ultra reactiva.",
    description: "Capellada de malla Celermesh translúcida ultraligera con placas de tracción Continental™ y entresuela Lightstrike de alto rendimiento.",
    image: "assets/images/adidas_adizero_pro_navy.jpg",
    colorways: [
      { name: "Navy Blue / White", image: "assets/images/adidas_adizero_pro_navy.jpg", sku: "ADI-ADIZ-NVY" }
    ],
    wholesalePrice: 125000,
    suggestedRetailPrice: 195000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 11. Adidas Response 2.0 Neon Boost
  {
    id: "prod-snk-011",
    sku: "ADI-RESP-NEON",
    name: "Adidas Response 2.0 Neon Boost",
    category: "Running & Tech",
    tagline: "Amortiguación suave Cloudfoam con acentos vibrantes verde neón para alto rendimiento.",
    description: "Cuello acolchado de espuma, soporte exterior en el talón de TPU y entresuela gruesa Cloudfoam para absorber impactos repetitivos.",
    image: "assets/images/adidas_response2_neon.jpg",
    colorways: [
      { name: "Grey / Neon Green Spark", image: "assets/images/adidas_response2_neon.jpg", sku: "ADI-RESP-NEON" }
    ],
    wholesalePrice: 125000,
    suggestedRetailPrice: 200000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 12. Skechers Trail Explorer All-Terrain (Ref 8088)
  {
    id: "prod-snk-012",
    sku: "SKC-TRL-8088",
    name: "Skechers Trail Explorer All-Terrain (Ref 8088)",
    category: "Running & Tech",
    tagline: "Diseñado para caminatas, cerros de Cali (Tres Cruces / Cristo Rey) y asfalto rudo.",
    description: "Suela con tacos multidireccionales de tracción agresiva, plantilla Memory Foam refrigerada por aire y capellada hidrófuga reforzada.",
    image: "assets/images/skechers_trail_8088.jpg",
    colorways: [
      { name: "Charcoal Trail Rugged", image: "assets/images/skechers_trail_8088.jpg", sku: "SKC-TRL-8088" }
    ],
    wholesalePrice: 125000,
    suggestedRetailPrice: 200000,
    sizes: [38, 39, 40, 41, 42, 43, 44],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 13. Le Coq Sportif Omega Urban Pink
  {
    id: "prod-snk-013",
    sku: "LCS-URB-PNK",
    name: "Le Coq Sportif Omega Urban Pink",
    category: "Skate & Casual",
    tagline: "Elegancia francesa en gamuza suave color rosa pastel con suela de goma vintage.",
    description: "Perfil bajo clásico confeccionado en gamuza aterciopelada y nylon transpirable con el emblemático logo del gallo bordado al tono.",
    image: "assets/images/lecoq_runner_pink.jpg",
    colorways: [
      { name: "Rose Pastel Vintage", image: "assets/images/lecoq_runner_pink.jpg", sku: "LCS-URB-PNK" }
    ],
    wholesalePrice: 110000,
    suggestedRetailPrice: 180000,
    sizes: [35, 36, 37, 38, 39],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 14. LV Trainer Maxi Black Diamond Edition
  {
    id: "prod-snk-014",
    sku: "LV-TRN-MAXIBLK",
    name: "LV Trainer Maxi Black Diamond Edition",
    category: "Chunky & Moda",
    tagline: "Inspirada en el básquetbol vintage con cordones gruesos maxi y motivos Monogram.",
    description: "Cuero de becerro grabado de alto gramaje con flores Monogram en la suela y lateral. Cordones anchos acolchados de impacto visual extremo.",
    image: "assets/images/lv_trainer_maxi_black.jpg",
    colorways: [
      { name: "Black Monogram Luxury", image: "assets/images/lv_trainer_maxi_black.jpg", sku: "LV-TRN-MAXIBLK" }
    ],
    wholesalePrice: 185000,
    suggestedRetailPrice: 320000,
    sizes: [39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 15. New Balance 9060 Triple Black (Ref 7128A)
  {
    id: "prod-snk-015",
    sku: "NB-9060-7128A",
    name: "New Balance 9060 Triple Black (Ref 7128A)",
    category: "Chunky & Moda",
    tagline: "La silueta chunky más viral con diseño futurista de la serie 99X y amortiguación ABZORB.",
    description: "Líneas onduladas y proporciones exageradas en la entresuela esculpida. Detalles reflectivos sutiles, amortiguación ABZORB y SBS, con logo 'N' lateral bordado.",
    image: "assets/images/nb_9060_triple_black.jpg",
    colorways: [
      { name: "Phantom Black", image: "assets/images/nb_9060_triple_black.jpg", sku: "NB-9060-7128A" }
    ],
    wholesalePrice: 155000,
    suggestedRetailPrice: 250000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 16. Hugo Boss Titanium Runner (Ref D5 2867)
  {
    id: "prod-snk-016",
    sku: "BOSS-TITAN-D5",
    name: "Hugo Boss Titanium Runner (Ref D5 2867)",
    category: "Chunky & Moda",
    tagline: "Sneaker casual de lujo europeo en malla técnica transpirable con suela geométrica.",
    description: "Combinación de neopreno elástico, malla deportiva de alta densidad y termoformados sintéticos con branding 'BOSS' en relieve lateral dorado.",
    image: "assets/images/boss_titanium_runner.jpg",
    colorways: [
      { name: "Black Gold Edition", image: "assets/images/boss_titanium_runner.jpg", sku: "BOSS-TITAN-D5" }
    ],
    wholesalePrice: 160000,
    suggestedRetailPrice: 260000,
    sizes: [39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 17. On Cloudmonster Swiss Engineering (Mint)
  {
    id: "prod-snk-017",
    sku: "ON-MONSTER-MNT",
    name: "On Cloudmonster Swiss Engineering (Mint)",
    category: "Running & Tech",
    tagline: "Máxima amortiguación CloudTec® en combinación de blanco puro con detalles verde menta.",
    description: "Superespuma Helion™ y placa Speedboard® de propulsión rápida. Capellada ligera en poliéster reciclado con detalles reflectivos.",
    image: "assets/images/on_cloudmonster_mint.jpg",
    colorways: [
      { name: "Mint Lime Accent", image: "assets/images/on_cloudmonster_mint.jpg", sku: "ON-MONSTER-MNT" }
    ],
    wholesalePrice: 145000,
    suggestedRetailPrice: 235000,
    sizes: [38, 39, 40, 41, 42, 43],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  },

  // 18. Adidas Superstar XLG Chunky Platform
  {
    id: "prod-snk-018",
    sku: "ADI-SST-XLG",
    name: "Adidas Superstar XLG Chunky Platform",
    category: "Chunky & Moda",
    tagline: "Proporciones aumentadas con entresuela de plataforma y la icónica puntera concha de caucho.",
    description: "Cuero suave blanco con 3 rayas negras dentadas sobredimensionadas, lengüeta acolchada con acolchado EVA y forro textil suave.",
    image: "assets/images/adidas_superstar_xlg.jpg",
    colorways: [
      { name: "White Black XLG", image: "assets/images/adidas_superstar_xlg.jpg", sku: "ADI-SST-XLG" }
    ],
    wholesalePrice: 135000,
    suggestedRetailPrice: 220000,
    sizes: [36, 37, 38, 39, 40, 41, 42],
    supplierId: "sup-001",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)",
    createdAt: "2026-09-01"
  }
];

// =========================================================================
// SISTEMA DE AUTENTICACIÓN & ESCENARIOS EN PRODUCCIÓN (CRM BASTION / GHOST)
// =========================================================================
const DEMO_ACCOUNTS = {
  // COMERCIO 1: Vanessa Castellar (Bodega Matriz Cali - Cliente Objetivo Cerrado)
  vanessa: {
    id: "user-vanessa-01",
    tenantId: "sup-001",
    storeId: "store-001",
    role: "supplier",
    name: "Vanessa Castellar Shoes",
    businessName: "Vanessa Castellar Shoes (San Andresito de la 38, Cali)",
    email: "vanessa@castellarshoes.com",
    username: "vanessa",
    password: "Calishoes2026",
    pin: "8820",
    phone: "573505337256",
    isMasterSupplier: true,
    securityNote: "Cuenta Matriz Mayorista con 10 líneas de WhatsApp y red de Sneaker Partners."
  },

  // SNEAKER PARTNER 1 DE VANESSA: Cali Shoes Distribuidora (Sur / Ciudad Jardín)
  calishoes: {
    id: "user-calishoes-02",
    tenantId: "store-002",
    storeId: "store-002",
    parentSupplierId: "sup-001",
    username: "calishoes",
    name: "Cali Shoes Distribuidora",
    businessName: "Cali Shoes Distribuidora (Ciudad Jardín, Cali)",
    email: "contacto@calishoes.com",
    password: "Calishoes2026",
    pin: "1234",
    phone: "573155551234",
    role: "store-admin",
    isMasterSupplier: false,
    securityNote: "Sneaker Partner 1 Oficial de Vanessa en el Sur de Cali."
  },

  // SNEAKER PARTNER 2 DE VANESSA: Valle Kicks Palmira (Norte & Palmira)
  vallekicks: {
    id: "user-vallekicks-03",
    tenantId: "store-003",
    storeId: "store-003",
    parentSupplierId: "sup-001",
    username: "vallekicks",
    name: "Valle Kicks Palmira",
    businessName: "Valle Kicks Store (Palmira & Norte de Cali)",
    email: "vallekicks@gmail.com",
    password: "Calishoes2026",
    pin: "4321",
    phone: "573187779900",
    role: "store-admin",
    isMasterSupplier: false,
    securityNote: "Sneaker Partner 2 Oficial de Vanessa en Palmira y Norte de Cali."
  },

  // COMERCIO 2: Calzado Imperial Cali (Segunda Bodega Independiente y Aislada)
  imperial: {
    id: "user-imperial-04",
    tenantId: "sup-002",
    storeId: "store-004",
    role: "supplier",
    name: "Calzado Imperial Cali",
    businessName: "Calzado Imperial Mayorista (Centro, Cali)",
    email: "imperial@calzadoimperial.com",
    username: "imperial",
    password: "Calishoes2026",
    pin: "5500",
    phone: "573112223344",
    isMasterSupplier: true,
    securityNote: "Bodega Matriz 2 independiente con su propio catálogo y sus propios partners aislados."
  }
};

// LLAVE MAESTRA SUPER ADMIN SAAS (BASTION AI / GHOST CRM RECOVERY)
const SUPER_ADMIN_CONFIG = {
  masterEmail: "admin@bastion.ai",
  masterUsername: "ghost",
  masterKey: "BASTION-GHOST-2026",
  recoveryPin: "9999",
  platformOwner: "GHOST Infoproducer / Bastion AI",
  supportHotline: "+57 350 533 7256"
};

const INITIAL_STORES = [
  {
    id: "store-001",
    name: "Vanessa Castellar Shoes",
    tagline: "Bodega Matriz Mayorista — San Andresito de la 38, Cali.",
    phone: "573505337256",
    whatsappLines: VANESSA_WHATSAPP_LINES,
    neighborhood: "San Andresito de la 38 (Centro / Comuna 3), Cali",
    isSupplierStore: true,
    themeColor: "#e6192e",
    products: [
      { productId: "prod-snk-001", customPrice: 185000, active: true, availableSizes: [35, 36, 37, 38, 39, 40] },
      { productId: "prod-snk-002", customPrice: 200000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-003", customPrice: 220000, active: true, availableSizes: [37, 38, 39, 40, 41, 42] },
      { productId: "prod-snk-004", customPrice: 235000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-005", customPrice: 250000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-006", customPrice: 230000, active: true, availableSizes: [36, 37, 38, 39, 40, 41] },
      { productId: "prod-snk-007", customPrice: 215000, active: true, availableSizes: [37, 38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-008", customPrice: 195000, active: true, availableSizes: [35, 36, 37, 38, 39] },
      { productId: "prod-snk-009", customPrice: 210000, active: true, availableSizes: [36, 37, 38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-010", customPrice: 195000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-011", customPrice: 200000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-012", customPrice: 200000, active: true, availableSizes: [38, 39, 40, 41, 42, 43, 44] },
      { productId: "prod-snk-013", customPrice: 180000, active: true, availableSizes: [35, 36, 37, 38, 39] },
      { productId: "prod-snk-014", customPrice: 320000, active: true, availableSizes: [39, 40, 41, 42, 43] },
      { productId: "prod-snk-015", customPrice: 250000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-016", customPrice: 260000, active: true, availableSizes: [39, 40, 41, 42, 43] },
      { productId: "prod-snk-017", customPrice: 235000, active: true, availableSizes: [38, 39, 40, 41, 42, 43] },
      { productId: "prod-snk-018", customPrice: 220000, active: true, availableSizes: [36, 37, 38, 39, 40, 41, 42] }
    ]
  },
  {
    id: "store-002",
    name: "Cali Shoes Distribuidora",
    tagline: "Boutique especializada en calzado importado exclusivo en el Sur de Cali (Afiliada a Vanessa).",
    phone: "573154443322",
    neighborhood: "Ciudad Jardín / Valle del Lili, Cali",
    isSupplierStore: false,
    themeColor: "#e6192e",
    products: [
      { productId: "prod-snk-001", customPrice: 195000, active: true, availableSizes: [35, 36, 37, 38, 39] },
      { productId: "prod-snk-002", customPrice: 215000, active: true, availableSizes: [38, 39, 40, 41, 42] },
      { productId: "prod-snk-004", customPrice: 245000, active: true, availableSizes: [39, 40, 41, 42, 43] },
      { productId: "prod-snk-005", customPrice: 265000, active: true, availableSizes: [39, 40, 41, 42] },
      { productId: "prod-snk-009", customPrice: 225000, active: true, availableSizes: [37, 38, 39, 40, 41] },
      { productId: "prod-snk-014", customPrice: 340000, active: true, availableSizes: [40, 41, 42, 43] },
      { productId: "prod-snk-015", customPrice: 260000, active: true, availableSizes: [39, 40, 41, 42] },
      { productId: "prod-snk-016", customPrice: 275000, active: true, availableSizes: [39, 40, 41, 42] }
    ]
  },
  {
    id: "store-003",
    name: "Valle Kicks Palmira",
    tagline: "Boutique streetwear y dropshipping calzado en Palmira y Norte de Cali (Sneaker Partner de Vanessa).",
    phone: "573187779900",
    neighborhood: "Palmira Urbano & Comuna 2 (Versalles, Cali)",
    isSupplierStore: false,
    themeColor: "#e6192e",
    products: [
      { productId: "prod-snk-001", customPrice: 190000, active: true, availableSizes: [36, 37, 38, 39, 40] },
      { productId: "prod-snk-003", customPrice: 230000, active: true, availableSizes: [37, 38, 39, 40, 41] },
      { productId: "prod-snk-004", customPrice: 240000, active: true, availableSizes: [38, 39, 40, 41, 42] },
      { productId: "prod-snk-005", customPrice: 260000, active: true, availableSizes: [39, 40, 41, 42, 43] },
      { productId: "prod-snk-006", customPrice: 240000, active: true, availableSizes: [37, 38, 39, 40] },
      { productId: "prod-snk-011", customPrice: 210000, active: true, availableSizes: [38, 39, 40, 41, 42] }
    ]
  },
  {
    id: "store-004",
    name: "Calzado Imperial Cali",
    tagline: "Segunda Bodega Mayorista Independiente — Centro de Cali (Aislada de Vanessa).",
    phone: "573112223344",
    neighborhood: "Centro Comercial El Diamante / Centro, Cali",
    isSupplierStore: true,
    themeColor: "#2563eb",
    products: [
      { productId: "prod-snk-002", customPrice: 205000, active: true, availableSizes: [38, 39, 40, 41, 42] },
      { productId: "prod-snk-004", customPrice: 230000, active: true, availableSizes: [39, 40, 41, 42, 43] },
      { productId: "prod-snk-014", customPrice: 330000, active: true, availableSizes: [40, 41, 42, 43] }
    ]
  }
];

const CALI_NEIGHBORHOODS = [
  { zone: "Cali Sur (Comunas 17, 19, 22)", name: "El Ingenio / Comuna 17", fee: 12000, time: "Hoy en la tarde" },
  { zone: "Cali Sur (Comunas 17, 19, 22)", name: "Ciudad Jardín / Comuna 22", fee: 12000, time: "Hoy en la tarde" },
  { zone: "Cali Sur (Comunas 17, 19, 22)", name: "Valle del Lili / Bochalema", fee: 12000, time: "Hoy en la tarde" },
  { zone: "Cali Sur (Comunas 17, 19, 22)", name: "Limonar / Capri / Comuna 19", fee: 10000, time: "Hoy en la tarde" },
  { zone: "Cali Norte (Comunas 2, 4)", name: "Granada / Versalles / Comuna 2", fee: 10000, time: "Hoy en la tarde" },
  { zone: "Cali Norte (Comunas 2, 4)", name: "Chipichape / La Flora / Menga", fee: 12000, time: "Hoy en la tarde" },
  { zone: "Cali Centro & Oeste (Comunas 1, 3, 9)", name: "San Antonio / El Peñón / Comuna 3", fee: 9000, time: "Inmediato (Cerca a Bodega)" },
  { zone: "Cali Centro & Oeste (Comunas 1, 3, 9)", name: "San Fernando / Alameda", fee: 9000, time: "Inmediato (Cerca a Bodega)" },
  { zone: "Cali Oriente (Comunas 13, 14, 15, 16)", name: "Aguablanca / Mariano Ramos", fee: 14000, time: "Ruta AM / PM" },
  { zone: "Cali Oriente (Comunas 13, 14, 15, 16)", name: "Ciudad Córdoba / Antonio Nariño", fee: 13000, time: "Ruta AM / PM" },
  { zone: "Área Metropolitana", name: "Yumbo (Centro / Acopi)", fee: 15000, time: "24 Horas" },
  { zone: "Área Metropolitana", name: "Jamundí (Alfaguara / Urbano)", fee: 16000, time: "24 Horas" },
  { zone: "Área Metropolitana", name: "Palmira Urbano", fee: 18000, time: "24 Horas" }
];

const INITIAL_ORDERS = [
  {
    id: "ord-8812",
    date: "2026-09-01 10:24",
    storeName: "Sneakers Ciudad Jardín",
    productName: "Air Jordan 4 Retro 'Military Black'",
    size: 41,
    colorway: "Military Black Clásico",
    type: "B2B Restock (Reposición)",
    units: 4,
    totalWholesale: 620000,
    status: "En Preparación",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)"
  },
  {
    id: "ord-8811",
    date: "2026-09-01 09:45",
    storeName: "Zapatillas Aguablanca VIP",
    productName: "Nike Initiator Retro Runner Dama",
    size: 37,
    colorway: "Baby Blue Pastel",
    type: "B2B Restock (Reposición)",
    units: 6,
    totalWholesale: 690000,
    status: "Despachado en Moto",
    supplierName: "Vanessa Castellar Shoes (Bodega Central)"
  }
];
