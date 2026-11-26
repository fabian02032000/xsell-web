/* =====================================================================
   Cerebro del chat de Xsell
   - Entiende preguntas con errores de tipeo, sin tildes y con jerga.
   - Recuerda el nombre, la empresa y el sector del visitante.
   - Corta con amabilidad las faltas de respeto.
   - Estilo: Dale Carnegie (interés sincero, usar el nombre, no discutir,
     hablar de lo que le importa al otro) y Seth Godin (ser útil y
     generoso, contar historias reales, decir con honestidad para quién
     somos y pedir permiso antes de vender).
   Solo usa información real de Xsell: no inventa cifras ni precios.
   ===================================================================== */
(function (root) {
  "use strict";

  /* ---------- 1. Normalización ---------- */
  var JERGA = {
    q: "que", k: "que", ke: "que", qe: "que", xq: "porque", pq: "porque", porq: "porque", xk: "porque", pk: "porque",
    tb: "tambien", tmb: "tambien", tbn: "tambien", tambn: "tambien", d: "de", xfa: "por favor", porfa: "por favor", pls: "por favor",
    bn: "bien", msj: "mensaje", info: "informacion", infor: "informacion", cel: "celular", celu: "celular",
    wsp: "whatsapp", wpp: "whatsapp", wasap: "whatsapp", whats: "whatsapp", guasap: "whatsapp", whatsap: "whatsapp", watsap: "whatsapp", wassap: "whatsapp", ws: "whatsapp",
    tlf: "telefono", telf: "telefono", fono: "telefono", uds: "ustedes", ud: "usted", aki: "aqui", sq: "es que",
    grax: "gracias", grcs: "gracias", grs: "gracias", thx: "gracias", ola: "hola", olaa: "hola", saludos: "hola", saludo: "hola", bno: "bueno", kiero: "quiero",
    kien: "quien", pa: "para", toy: "estoy", vdd: "verdad", dnd: "donde", cmo: "como", komo: "como", nose: "no se",
    xsel: "xsell", exsell: "xsell", exel: "xsell", xel: "xsell", xcel: "xsell", xsells: "xsell", ntp: "no te preocupes",
    cuant: "cuanto", cuamto: "cuanto", cuanot: "cuanto", precion: "precio", prcio: "precio", presio: "precio", presios: "precios",
    xa: "para", mas: "mas", tmr: "", ps: "pues", pe: "pues", bueeno: "bueno", okey: "ok", oki: "ok", okis: "ok", okk: "ok", oka: "ok",
    dale: "ok", listo: "ok", perfecto: "ok", genial: "ok",  sip: "si", sii: "si", sep: "si", simon: "si", nop: "no", nel: "no", noo: "no",
    lead: "prospecto", leads: "prospectos", cliente: "cliente", call: "llamada", calls: "llamadas", sales: "ventas", sale: "venta"
  };
  function sinTildes(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function norm(s) {
    s = String(s || "").toLowerCase();
    s = s.replace(/https?:\/\/\S+|www\.\S+/g, " enlaceweb ");
    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, " correoelectronico ");
    s = sinTildes(s).replace(/ñ/g, "n");
    s = s.replace(/x\s+sell/g, "xsell").replace(/ex\s+sell/g, "xsell");
    s = s.replace(/[@4](?=[a-z])/g, "a").replace(/([a-z])0(?=[a-z])/g, "$1o").replace(/([a-z])3(?=[a-z])/g, "$1e").replace(/([a-z])1(?=[a-z])/g, "$1i").replace(/\$(?=[a-z])/g, "s");
    s = s.replace(/[^a-z0-9\s]/g, " ");
    s = s.replace(/([a-z])\1{2,}/g, "$1");
    var t = s.split(/\s+/).filter(Boolean).map(function (w) {
      if (/[a-z]/.test(w) && /[013457]/.test(w) && !/^(b2b|b2c|\d+[a-z]{0,3}|[a-z]{1,3}\d+)$/.test(w)) w = w.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
      if (Object.prototype.hasOwnProperty.call(JERGA, w)) return JERGA[w];
      if (w.length > 2 && w[0] === "k" && w !== "kam" && w.indexOf("kpi") !== 0) w = (/^k[ie]/.test(w) ? "qu" : "c") + w.slice(1);
      return w;
    });
    return t.join(" ").replace(/\s+/g, " ").trim();
  }

  /* ---------- 2. Raíces de palabras (español simplificado) ---------- */
  var VACIAS = new Set("de la el los las un una unos unas y e o u a al del en con por para mi mis tu tus su sus me te se le les lo nos es son esta este estos estas eso esto esa ese esos esas ya muy pues bueno ahi aqui alla asi sea seria ser estar estoy esta estan algo alguna alguno algun hay tiene tienen tengo tenemos the of and".split(" "));
  var SUF = ["aremos", "eremos", "iremos", "arian", "erian", "irian", "amientos", "imientos", "aciones", "iciones", "uciones", "amiento", "imiento", "mente", "acion", "icion", "ucion", "adoras", "adores", "ancias", "encias", "idades", "ables", "ibles", "istas", "adora", "ancia", "encia", "idad", "able", "ible", "ista", "ivos", "ivas", "ando", "iendo", "aron", "ieron", "amos", "emos", "imos", "aban", "ado", "ido", "ada", "ida", "ivo", "iva", "aria", "eria", "iria", "aran", "eran", "iran", "ara", "era", "ira", "ian", "aba", "ar", "er", "ir", "es", "as", "os", "an", "en", "a", "o", "e", "s"];
  var CACHE = Object.create(null);
  function raiz(w) {
    if (CACHE[w]) return CACHE[w];
    var r = w;
    if (w.length > 4) for (var i = 0; i < SUF.length; i++) { var f = SUF[i]; if (w.endsWith(f) && w.length - f.length >= 3) { r = w.slice(0, -f.length); break; } }
    CACHE[w] = r; return r;
  }
  function raices(texto) { return texto.split(" ").filter(function (w) { return w && !VACIAS.has(w); }).map(raiz); }

  /* ---------- 3. Tolerancia a errores de tipeo ---------- */
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var mn = Infinity;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < mn) mn = d[i][j];
      }
      if (mn > max) return max + 1;
    }
    return d[a.length][b.length];
  }

  /* ---------- 4. Moderación (respeto) ---------- */
  var GROSERIAS = ["mierda", "mrd", "puta", "puto", "putas", "putos", "ptm", "ctm", "csm", "conchatumadre", "conchesumadre", "conchetumare", "conchatumare", "concha", "chucha", "carajo", "cojudo", "cojuda", "cojudos", "huevon", "huevona", "huevones", "weon", "webon", "webona", "hdp", "hijueputa", "hijoputa", "pendejo", "pendeja", "pendejos", "imbecil", "imbeciles", "idiota", "idiotas", "estupido", "estupida", "estupidos", "tarado", "tarada", "retrasado", "retrasada", "mongol", "mongolo", "inutil", "inutiles", "basura", "maldito", "maldita", "malditos", "jodete", "joder", "jodido", "cabron", "cabrona", "gil", "gila", "gilazo", "baboso", "babosa", "tonto", "tonta", "tontos", "payaso", "payasa", "ladron", "ladrones", "estafador", "estafadores", "chupala", "chupame", "verga", "vrg", "pinga", "mamaguevo", "malparido", "gonorrea", "culero", "pajero", "zorra", "mamon", "mamona", "fuck", "shit", "bitch", "asshole", "stupid", "idiot", "wtf", "stfu", "lpm", "lptm", "mamada", "pelotudo", "boludo", "forro", "concha de tu madre"];
  var GRAVES = ["te voy a matar", "los voy a matar", "voy a matarte", "te mato", "los mato", "matarte", "te voy a buscar", "se donde viven", "se donde vives", "pon una bomba", "poner una bomba", "pongo una bomba", "te voy a violar", "violarte", "desnuda", "desnudo", "quiero sexo", "tener sexo", "sexo contigo", "nudes", "manda fotos tuyas", "tetas", "follar", "coger contigo", "chupamela", "pene", "vagina", "porno", "xxx", "negro de mierda", "indio de mierda", "cholo de mierda", "serrano de mierda", "maricon", "marica", "cabro de mierda", "sudaca", "veneco de mierda", "te odio puta", "puta de mierda"];
  var A_TI = /\b(eres|sos|eras|seras|tu|ti|te|usted|ustedes|son|xsell|bot|robot|chat|chatbot|asistente|empresa|agencia|ingrid|esta web|esta pagina|esta mierda de)\b/;
  var FRUSTRACION = /\b(no sirve|no sirves|pesimo chat|mal chat|chat malo|no me ayudas|no entiendes|no entiende|no me entiendes|no responde|no respondes|respuesta de robot|que mal|pesimo|pesima|malisimo|horrible|que fastidio|me estas cansando|aburrido|no ayudas|no me ayudas|inservible|no sabes nada|no sabe nada|que respuesta es esa|eso no te pregunte|no te pregunte eso|otra vez lo mismo|ya me dijiste|repites|no me estas respondiendo|eres un fracaso|que asco|asco de servicio|no respondes lo que|lo que te pregunte|no contestas lo que)\b/;
  function moderar(n, toks) {
    var t = " " + n + " ";
    for (var i = 0; i < GRAVES.length; i++) if (t.indexOf(" " + GRAVES[i] + " ") >= 0) return "grave";
    if (/\b(vete|andate|anda|vayanse|vayase|largate)\s+(a\s+la\s+(mierda|chucha|concha)|al\s+(carajo|diablo|demonio))\b/.test(n)) return "insulto";
    if (/\b(eres|sos|son|es)\s+(un|una|unos|unas)\s+(bruto|bruta|brutos|burro|burra|burros|rata|ratas|perro|perra|perros|animal|animales|bestia|asco|desastre|verguenza|porqueria|cerdo|cerda|cerdos)\b/.test(n) && A_TI.test(n)) return "insulto";
    var gros = toks.filter(function (w) { return GROSERIAS.indexOf(w) >= 0; });
    if (t.indexOf(" concha de tu madre ") >= 0 || t.indexOf(" hijo de puta ") >= 0 || t.indexOf(" hija de puta ") >= 0 || t.indexOf(" tu madre ") >= 0 || t.indexOf(" tu vieja ") >= 0) return "insulto";
    if (gros.length) {
      var exclam = ["mierda", "mrd", "puta", "ptm", "chucha", "carajo", "joder", "lpm", "lptm", "wtf", "shit", "concha"];
      var soloExclam = gros.every(function (w) { return exclam.indexOf(w) >= 0; });
      var propioSujeto = /\b(mis|mi|nuestros|nuestras|nuestro|nuestra|la competencia|el mercado|las ventas|este mes|el negocio)\s+(\w+\s+)?(son|es|estan|esta|no)\b/.test(n) || /\b(mis|mi|nuestras|nuestros)\s+(ventas|vendedores|clientes|equipo|asesores|numeros|resultados)\b/.test(n);
      var directo = /\b(eres|sos|seras|tu eres|ustedes son|son unos|son unas|son una|son un|eres un|eres una|bot|robot|chatbot|asistente|xsell|ingrid|esta empresa|esta agencia|este chat|esta web|esta pagina)\b/.test(n) || (/\b(te|ti|usted|ustedes)\b/.test(n) && !propioSujeto);
      if (directo && !(propioSujeto && !/\b(eres|sos|ustedes son|tu eres)\b/.test(n))) return "insulto";
      if (soloExclam || propioSujeto) return "desahogo";
      var resto = toks.filter(function (w) { return gros.indexOf(w) < 0 && !VACIAS.has(w); });
      return resto.length <= 1 ? "insulto" : "desahogo";
    }
    if (FRUSTRACION.test(n)) return "frustracion";
    return null;
  }

  /* ---------- 5. Estado de la conversación ---------- */
  var E = { nombre: "", empresa: "", sector: "", cargo: "", turnos: 0, strikes: 0, cerrado: false, ultimo: "", pendiente: "", usados: {}, temas: [], frustr: 0, repetido: 0, previo: "" };
  function reiniciar() { E = { nombre: "", empresa: "", sector: "", cargo: "", turnos: 0, strikes: 0, cerrado: false, ultimo: "", pendiente: "", usados: {}, temas: [], frustr: 0, repetido: 0, previo: "" }; }

  function capital(s) { return s.replace(/\b([a-záéíóúñ])/gi, function (m) { return m.toUpperCase(); }); }
  var NO_NOMBRE = new Set("gerente jefe dueno duena dueño dueña encargado encargada director directora asesor asesora vendedor vendedora el la de una un nuevo nueva interesado interesada cliente empresa emprendedor emprendedora administrador administradora socio socia ceo coordinador coordinadora analista supervisor supervisora del muy bien mal yo tu usted ustedes peruano peruana argentino argentina chileno chilena humano persona bot robot quien que como un una la el lo nadie alguien".split(" "));
  var SECTORES = [["Telecomunicaciones", /\b(telecom\w*|telefon\w* movil|operador\w*|internet|fibra|portabilidad|chips?|lineas? (movil|postpago|prepago)|postpago|prepago)\b/], ["Retail", /\b(retail|tiendas?|ropa|moda|calzado|zapatill\w*|supermercad\w*|electro\w*|ecommerce|e commerce|tienda online|comercio)\b/], ["Banca y seguros", /\b(banc\w*|seguros?|aseguradora|financier\w*|credito\w*|prestamo\w*|tarjetas? de credito|fintech|cooperativa|caja municipal)\b/], ["Automotriz", /\b(automotri\w*|autos?|carros?|vehicul\w*|concesionari\w*|motos?|camionetas?|repuestos)\b/], ["Salud", /\b(salud|clinica\w*|medic\w*|hospital\w*|odontolog\w*|dental|laboratorio\w*|farmac\w*|seguro de salud|eps)\b/], ["Consumo masivo", /\b(consumo masivo|bebidas|alimentos|snacks|abarrotes|distribuidor\w*|cpg|productos de consumo)\b/], ["Inmobiliario", /\b(inmobiliari\w*|departamentos|casas|lotes|terrenos|bienes raices|proyectos? inmobiliario\w*)\b/], ["Educación", /\b(educacion|universidad\w*|instituto\w*|colegio\w*|academia\w*|cursos?|maestria\w*|postgrado\w*|escuela\w*)\b/], ["Tecnología", /\b(software|saas|tecnologia|apps?|aplicativo\w*|sistemas?|erp|crm propio)\b/], ["Turismo", /\b(turismo|hotel\w*|viajes|agencia de viajes|aerolinea\w*|restaurant\w*)\b/], ["Energía", /\b(energia|solar|paneles|gas natural|electricidad)\b/], ["Logística", /\b(logistic\w*|courier|envios|transporte de carga)\b/]];

  function capturarDatos(orig, n, toks) {
    var dijo = [];
    var m = n.match(/\b(?:me llamo|mi nombre es|mi nombre|soy el|soy la|aqui|habla|te saluda|le saluda|les saluda)\s+([a-z]+)(?:\s+([a-z]+))?/);
    if (!m) { var m2 = n.match(/^(?:hola\s+)?soy\s+([a-z]+)(?:\s+([a-z]+))?/); if (m2 && !NO_NOMBRE.has(m2[1]) && toks.length <= 10) m = m2; }
    if (!m && E.pendiente === "nombre" && toks.length <= 3 && /^[a-z]+(\s[a-z]+)?$/.test(n) && !NO_NOMBRE.has(toks[0]) && !/^(si|no|ok|hola|gracias|nada|bien|mal|nose|no se)$/.test(n)) m = [n, toks[0], toks[1]];
    if (m && m[1] && !NO_NOMBRE.has(m[1]) && m[1].length > 1) {
      var ap = m[2] && !NO_NOMBRE.has(m[2]) && !/^(y|de|del|la|el|gerente|jefe|dueno|trabajo|tengo|quiero|necesito|busco|mi|me|te|les|de)$/.test(m[2]) ? " " + m[2] : "";
      var nuevo = capital(m[1] + (ap && m[2].length > 2 ? ap : ""));
      if (nuevo !== E.nombre) { E.nombre = nuevo.split(" ")[0]; dijo.push("nombre"); }
    }
    var em = orig.match(/(?:mi empresa (?:es|se llama)|trabajo en|trabajo para|vengo de|represento a|somos|de la empresa|la empresa)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.\- ]{2,40})/i);
    if (em) {
      var nom = em[1].replace(/\s+(y|que|pero|con|para|donde|y quiero|y necesito|queremos|necesitamos).*$/i, "").trim();
      if (nom && !/^(una|un|el|la|los|las)\s/i.test(nom) && nom.split(" ").length <= 5 && !/^(una agencia|un equipo|una empresa|empresa|pyme|peque|mediana|grande)/i.test(nom)) { E.empresa = nom; dijo.push("empresa"); }
    }
    for (var i = 0; i < SECTORES.length; i++) if (SECTORES[i][1].test(n)) { if (E.sector !== SECTORES[i][0]) { E.sector = SECTORES[i][0]; dijo.push("sector"); } break; }
    var cg = n.match(/\b(soy|como)\s+(el\s+|la\s+)?(gerente|jefe|jefa|director|directora|dueno|duena|encargado|encargada|coordinador|coordinadora|supervisor|supervisora|ceo|fundador|fundadora|socio|socia)\b(\s+(de|comercial|general|de ventas|de marketing)\s*\w*)?/);
    if (cg) { E.cargo = cg[3] + (cg[4] || ""); dijo.push("cargo"); }
    return dijo;
  }

  /* ---------- 6. Intenciones (se cargan abajo) ---------- */
  var INT = [];
  var VOC = new Set(), VOCW = new Set();
  var INTERROG = new Set(["que", "cual", "cuale", "como", "dond", "donde", "quien", "quiene", "cuando", "cuant", "porque", "por"]);
  var GENERICO = new Set(["trabaj", "hac", "hace", "teng", "tien", "tiene", "quier", "necesit", "pued", "pue", "sab", "vend", "vent", "empres", "client", "ofrec", "dan", "dar", "ver", "habl", "dic", "dice", "deb", "hag", "va", "voy", "van", "ir", "da", "doy", "sirv", "usted", "ustede", "son", "otr", "bien", "mejor", "mas", "tod", "todo", "toda", "todos", "cosa", "si", "no", "ok"]);
  function pesoTok(x) { return INTERROG.has(x) ? 0.35 : GENERICO.has(x) ? 0.45 : 1; }
  function prep(p) {
    var w = 1, s = p, exacta = false;
    var bar = p.lastIndexOf("|"); if (bar > 0) { w = parseFloat(p.slice(bar + 1)) || 1; s = p.slice(0, bar); }
    if (s.charAt(0) === "=") { exacta = true; s = s.slice(1); }
    var ns = norm(s), r = raices(ns);
    r.forEach(function (x) { VOC.add(x); });
    ns.split(" ").forEach(function (w) { if (w.length >= 4) VOCW.add(w); });
    var suma = r.reduce(function (a, x) { return a + pesoTok(x); }, 0);
    var peso = exacta ? 3.2 : Math.max(0, 1.25 * suma - 0.25);
    return { r: r, w: w * peso, txt: s, ex: exacta ? " " + ns + " " : "" };
  }
  var DF = Object.create(null), TOPW = 0.9, TOPT = 0.7, TOPS = 0.5;
  function cargar(lista) {
    lista.forEach(function (it) {
      it._p = (it.p || []).map(prep).filter(function (x) { return x.r.length; });
      it._n = (it.no || []).map(function (x) { return x.indexOf(" ") > 0 && x.charAt(0) !== "=" ? prep("=" + x) : prep(x); }).filter(function (x) { return x.r.length || x.ex; });
      it._k = new Set();
      it._p.forEach(function (p) { p.r.forEach(function (x) { if (!INTERROG.has(x) && !GENERICO.has(x) && x.length > 2) it._k.add(x); }); });
      (it.k || []).forEach(function (w) { raices(norm(w)).forEach(function (x) { if (!INTERROG.has(x) && !GENERICO.has(x) && x.length > 2) { it._k.add(x); VOC.add(x); } }); norm(w).split(" ").forEach(function (x) { if (x.length >= 4) VOCW.add(x); }); });
      it._k.forEach(function (x) { DF[x] = (DF[x] || 0) + 1; });
      INT.push(it);
    });
  }

  function corregirPalabras(txt) {
    return txt.split(" ").map(function (w) {
      if (w.length < 5 || VOCW.has(w) || /\d/.test(w) || VOC.has(raiz(w))) return w;
      var max = w.length >= 8 ? 2 : 1, mejor = null, md = max + 1;
      VOCW.forEach(function (v) { if (Math.abs(v.length - w.length) > max) return; if (v[0] !== w[0] && v[1] !== w[1]) return; var d = dist(w, v, max); if (d < md) { md = d; mejor = v; } });
      return mejor || w;
    }).join(" ");
  }
  function corregir(rs) {
    return rs.map(function (w) {
      if (VOC.has(w) || w.length < 5 || /\d/.test(w)) return w;
      var max = w.length >= 8 ? 2 : 1, mejor = null, md = max + 1;
      VOC.forEach(function (v) { if (Math.abs(v.length - w.length) > max || v[0] !== w[0] && w.length < 7) return; var d = dist(w, v, max); if (d < md) { md = d; mejor = v; } });
      return mejor || w;
    });
  }
  function puntuar(rs, ntxt) {
    var set = new Set(rs), res = [], tx = " " + (ntxt || "") + " ";
    function casa(p) { return p.ex ? tx.indexOf(p.ex) >= 0 : p.r.every(function (x) { return set.has(x); }); }
    INT.forEach(function (it) {
      if (it._n.some(casa)) return;
      var best = 0, extra = 0, top = 0;
      it._p.forEach(function (p) { if (casa(p)) { if (p.w > best) { if (best) extra += 0.2; best = p.w; } else extra += 0.2; } });
      set.forEach(function (x) { if (it._k.has(x)) top += TOPW / Math.sqrt(DF[x]); });
      top = Math.min(top, 2);
      if (best >= 0.8 || top >= TOPT) res.push({ it: it, s: best + Math.min(extra, 1) + top * TOPS + (it.pr || 0) * 0.01 });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return res;
  }

  /* ---------- 7. Estilo Carnegie: nombre, interés sincero, preguntas ---------- */
  var PREGUNTAS = [
    "¿Cómo manejan hoy el seguimiento de los interesados que les llegan?",
    "¿Qué parte de tu venta sientes que hoy se te está escapando?",
    "¿Tu equipo comercial es propio o hoy lo hace alguien más?",
    "¿Por qué canal te llegan más interesados: WhatsApp, redes, llamadas o tienda?",
    "¿Qué te gustaría lograr en ventas en los próximos meses?"
  ];
  function elegir(arr, clave) {
    if (typeof arr === "string") return arr;
    var k = clave || "x"; var i = (E.usados[k] || 0) % arr.length; E.usados[k] = (E.usados[k] || 0) + 1; return arr[i];
  }
  function rellenar(t) {
    return t.replace(/\{nombre\}/g, E.nombre || "").replace(/\{empresa\}/g, E.empresa || "tu empresa").replace(/\{sector\}/g, (E.sector || "tu sector").toLowerCase())
      .replace(/\{,nombre\}/g, E.nombre ? ", " + E.nombre : "").replace(/\{nombre,\}/g, E.nombre ? E.nombre + ", " : "");
  }
  function personalizar(t, it) {
    if (E.nombre && it && !it.social && t.indexOf(E.nombre) < 0 && E.turnos % 3 === 1) {
      t = t.charAt(0) === "¡" || t.charAt(0) === "¿" ? E.nombre + ", " + t.charAt(0) + t.charAt(1).toLowerCase() + t.slice(2) : E.nombre + ", " + t.charAt(0).toLowerCase() + t.slice(1);
    }
    if (it && it.pregunta && !/\?\s*$/.test(t) && E.turnos % 2 === 0) t += "\n\n" + elegir(PREGUNTAS, "preg");
    return t;
  }

  /* ---------- 8. Respuestas especiales ---------- */
  var R = {
    grave: "Hasta aquí llega esta conversación: no podemos continuar con este tipo de mensajes. Si más adelante quieres hablar de cómo vender más, con gusto te atendemos con respeto. Que tengas un buen día.",
    insulto1: [
      "Entiendo que algo te molestó y de verdad quiero ayudarte. Para seguir, te pido que mantengamos el respeto. ¿Qué necesitas resolver?",
      "Lamento si algo no salió como esperabas. Estoy aquí para ayudarte, y para eso necesitamos conversar con respeto. ¿Me cuentas qué buscas?"
    ],
    insulto2: "Prefiero cerrar aquí la conversación para cuidar el respeto de ambos. Cuando quieras retomarla con calma, aquí estaremos con gusto. ¡Que te vaya muy bien!",
    desahogo: [
      "Te entiendo, cuando las ventas no salen frustra mucho. La buena noticia es que casi siempre la venta se pierde en un punto concreto que se puede encontrar y corregir.",
      "Se nota que esto te tiene cansado, y es normal: vender sin resultados desgasta a cualquiera. Vamos a ver juntos dónde se está escapando tu venta."
    ],
    frustracion: [
      "Tienes razón en pedirme más precisión, disculpa. Cuéntame con tus palabras qué necesitas y te respondo directo; y si prefieres hablar con una persona, Ingrid, nuestra Asesora Comercial, te contacta.",
      "Perdón si no te entendí bien. Intentemos de nuevo: ¿tu duda es sobre precios, sobre cómo trabajamos o sobre un problema de ventas de tu empresa?"
    ],
    repetido: "Me escribiste lo mismo, así que quizá mi respuesta no te sirvió. ¿Lo vemos desde otro ángulo? Cuéntame un poco de tu empresa y te doy algo más concreto, o si prefieres, Ingrid te contacta directamente.",
    galimatias: [
      "Creo que no logré entender tu mensaje. ¿Me lo escribes de otra forma? Puedes preguntarme por precios, cómo trabajamos, casos reales o la Fotografía Comercial Xsell.",
      "Mmm, no entendí bien eso. ¿Te refieres a algo de ventas, de precios o de cómo empezar con Xsell?"
    ],
    nada: [
      "Buena pregunta. No quiero darte una respuesta a medias: eso lo resolvemos mejor conversando de tu caso puntual. En la Fotografía Comercial Xsell, sin costo, un KAM revisa tu negocio en 72 horas y te responde con información real. ¿Te gustaría agendarla?",
      "Esa es una consulta que merece una respuesta precisa y no una genérica. Lo mejor es que Ingrid, nuestra Asesora Comercial, la vea contigo. ¿Te parece si me dejas tus datos y te contacta?",
      "Quiero ayudarte bien con eso. ¿Me das un poco más de contexto? Por ejemplo, a qué se dedica tu empresa y qué te gustaría mejorar en tus ventas."
    ]
  };

  /* ---------- 9. Responder ---------- */
  function responder(q, extra) {
    extra = extra || {};
    if (extra.sector && !E.sector) E.sector = extra.sector;
    var orig = String(q || "").trim();
    var out = { texto: "", lead: false, rel: null, ir: null, cerrar: false, acciones: true, intent: "" };
    if (E.cerrado) { out.texto = "Esta conversación quedó cerrada. Si quieres retomarla, recarga la página más tarde y con gusto te atendemos."; out.cerrar = true; out.acciones = false; out.intent = "cerrado"; return out; }
    if (!orig) { out.texto = "¿En qué te puedo ayudar?"; out.intent = "vacio"; return out; }
    E.turnos++;
    var n = norm(orig), toks = n.split(" ").filter(Boolean);

    /* 9.1 Respeto */
    var mod = moderar(n, toks);
    if (mod === "grave") { E.cerrado = true; out.texto = R.grave; out.cerrar = true; out.acciones = false; out.intent = "mod_grave"; return out; }
    if (mod === "insulto") {
      E.strikes++;
      if (E.strikes >= 2) { E.cerrado = true; out.texto = R.insulto2; out.cerrar = true; out.acciones = false; out.intent = "mod_cierre"; return out; }
      out.texto = elegir(R.insulto1, "ins"); out.acciones = false; out.intent = "mod_insulto"; return out;
    }

    if (mod === "frustracion" && toks.length <= 7) { E.frustr++; out.texto = elegir(R.frustracion, "fru"); out.lead = E.frustr >= 2; out.intent = "mod_frustracion"; return out; }

    /* 9.2 Repetición exacta */
    if (n && n === E.previo && toks.length > 2) { E.repetido++; out.texto = R.repetido; out.lead = true; out.intent = "repetido"; E.previo = n; return out; }
    E.previo = n;

    /* 9.3 Datos del visitante */
    var dijo = capturarDatos(orig, n, toks);

    /* 9.4 Intención */
    var RELLENO = /^(buenos dias|buenas tardes|buenas noches|buen dia|hola|holi|buenas|hey|oye|oiga|estimado|estimados|estimada|una consulta|consulta|una pregunta|pregunta|tengo una consulta|tengo una pregunta|disculpa|disculpe|perdon|perdona|por favor|ok|bueno|mira|amigo|amiga|senor|senorita|xsell|alo|saludos)\b\s*/;
    var nLimpio = n, guard = 0;
    while (RELLENO.test(nLimpio) && guard++ < 4) { var sig = nLimpio.replace(RELLENO, ""); if (!sig || sig.split(" ").length < 1) break; nLimpio = sig; }
    if (!nLimpio.trim()) nLimpio = n;
    var nc = corregirPalabras(nLimpio);
    var rs = corregir(raices(nc));
    var res = puntuar(rs, nc);
    var top = res[0];

    /* galimatías: casi sin vocales o sin palabras conocidas */
    var letras = n.replace(/[^a-z]/g, "");
    var vocales = (letras.match(/[aeiou]/g) || []).length;
    var conocidas = rs.filter(function (w) { return VOC.has(w); }).length;
    var esGalimatias = !top && letras.length >= 4 && (vocales / letras.length < 0.2 || (conocidas === 0 && toks.length <= 2 && !/^[a-z]+$/.test(n) === false && !dijo.length && letras.length > 6 && !/[aeiou]{1}[a-z]*[aeiou]/.test(letras)));
    if (!letras.length && /^\s*\d[\d\s+-]*$/.test(orig)) { out.texto = "Veo un número. Si es tu celular, por seguridad no lo dejes suelto en el chat: usa el formulario y Ingrid te contacta. ¿Quieres que te lo muestre?"; out.intent = "numero"; E.pendiente = "agendar"; return out; }
    if (!letras.length) { out.texto = "¡Recibido! 😊 ¿En qué te puedo ayudar? Puedes preguntarme cómo trabajamos, precios o pedir tu Fotografía Comercial Xsell.".replace(" 😊", ""); out.intent = "emoji"; return out; }

    /* respuestas cortas a una pregunta pendiente */
    var afirma = /^(si|ok|vale|claro|por supuesto|obvio|de acuerdo|me parece|me interesa|si me interesa|si quiero|quiero|si por favor|por favor|ok gracias|si claro|claro que si|hagamoslo|vamos|adelante|agendemos|agenda|ok agendemos)\b/.test(n) && toks.length <= 5;
    var niega = /^(no|no gracias|ahora no|todavia no|aun no|despues|luego|mas adelante|no por ahora|tal vez despues|lo pienso)\b/.test(n) && toks.length <= 5;

    if (dijo.indexOf("nombre") >= 0 && (!top || top.s < 2.2)) {
      E.pendiente = "empresa";
      out.texto = dijo.indexOf("sector") >= 0
        ? "¡Mucho gusto, {nombre}! Qué bueno, ya acompañamos a empresas de " + E.sector.toLowerCase() + " y conocemos bien sus retos. ¿Qué te gustaría mejorar hoy en tus ventas?"
        : elegir(["¡Mucho gusto, {nombre}! Me alegra tenerte por aquí. Cuéntame, ¿a qué se dedica tu empresa y qué te gustaría mejorar en tus ventas?", "¡Encantado, {nombre}! Para ayudarte mejor, ¿me cuentas a qué se dedica tu empresa?"], "nom");
      out.texto = rellenar(out.texto); out.intent = "presentacion"; out.acciones = false; return out;
    }
    var afirmacion = /^(hola\s+|buenas\s+|bueno\s+|ok\s+)?(tengo|tenemos|soy|somos|trabajo|vendo|vendemos|mi empresa|nuestra empresa|es una|represento|estoy en|me dedico|nos dedicamos|manejo|dirijo|tengo una|mi negocio|nuestro negocio)\b/.test(n) && orig.indexOf("?") < 0;
    if ((dijo.indexOf("empresa") >= 0 || dijo.indexOf("sector") >= 0) && afirmacion && (!top || top.s < 2.2) && toks.length <= 14) {
      E.pendiente = "dolor";
      out.texto = rellenar(E.sector && dijo.indexOf("sector") >= 0
        ? "¡Qué bien{,nombre}! Ya acompañamos a empresas de " + E.sector.toLowerCase() + ", así que conocemos bien sus retos. ¿Qué te gustaría mejorar hoy: conseguir más ventas de tus interesados, ordenar tu base de datos o que tus clientes vuelvan a comprar?"
        : "¡Gracias por contarme{,nombre}! Me ayuda mucho saber de {empresa}. ¿Qué te gustaría mejorar hoy: convertir más interesados en ventas, ordenar tu base de datos o que tus clientes vuelvan a comprar?");
      out.intent = "contexto"; out.rel = ["Me llegan interesados pero se enfrían y los pierdo. ¿Qué me recomiendan?", "¿Cuánto cuesta trabajar con Xsell?", "¿Qué es la Fotografía Comercial Xsell?"]; return out;
    }
    if (!top && afirma && E.pendiente === "agendar") { E.pendiente = ""; out.texto = rellenar("¡Excelente decisión{,nombre}! Déjame tus datos aquí abajo y Ingrid o un KAM te contacta para coordinar tu Fotografía Comercial Xsell, sin costo."); out.lead = true; out.intent = "si_agendar"; return out; }
    if (!top && niega && E.pendiente === "agendar") { E.pendiente = ""; out.texto = rellenar("Sin problema{,nombre}, sin presión. Cuando quieras, aquí estaré. Mientras tanto, si quieres puedes hacer el diagnóstico rápido de 3 minutos en la web: es gratis y te muestra dónde se puede estar perdiendo tu venta."); out.intent = "no_agendar"; return out; }

    if (!top) {
      if (!afirma && !niega && (esGalimatias || letras.length <= 2 || (conocidas === 0 && toks.length === 1 && letras.length > 2))) { out.texto = elegir(R.galimatias, "gal"); out.intent = "galimatias"; return out; }
      if (afirma) { out.texto = rellenar("¡Perfecto{,nombre}! ¿En qué te ayudo? Puedo contarte cómo trabajamos, cómo es el pago por resultados o agendar tu Fotografía Comercial Xsell sin costo."); out.intent = "afirmacion"; out.rel = ["¿Cómo trabajan?", "¿Cómo es el pago por resultados?", "¿Qué es la Fotografía Comercial Xsell?"]; return out; }
      if (niega) { out.texto = "Entendido. Si en algún momento te sirve, aquí estoy para ayudarte con lo que necesites sobre ventas."; out.intent = "negacion"; return out; }
      if (mod === "desahogo") { out.texto = elegir(R.desahogo, "des") + "\n\n¿Me cuentas qué está pasando con tus ventas?"; out.intent = "mod_desahogo"; return out; }
      if (mod === "frustracion") { E.frustr++; out.texto = elegir(R.frustracion, "fru"); out.lead = E.frustr >= 2; out.intent = "mod_frustracion"; return out; }
      out.texto = rellenar(elegir(R.nada, "nada")); out.intent = "sin_respuesta"; out.lead = E.turnos > 3; E.pendiente = "agendar"; return out;
    }

    var it = top.it;
    var resp = typeof it.r === "function" ? it.r(E, n) : elegir(it.r, it.id);
    resp = rellenar(resp);
    if (mod === "desahogo") resp = elegir(R.desahogo, "des") + "\n\n" + resp;
    if (mod === "frustracion" && !it.social) resp = "Perdón si antes no fui claro. " + resp;
    var saludoAntes = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|buen dia|hey|que tal|saludos)\b/.test(n) && !it.social && nLimpio !== n;
    if (saludoAntes) resp = (E.nombre ? "¡Hola, " + E.nombre + "! " : "¡Hola! ") + resp;
    resp = personalizar(resp, it);
    out.texto = resp; out.lead = !!it.lead; out.rel = it.rel || null; out.ir = it.ir || null; out.intent = it.id; out.acciones = it.acciones !== false;
    if (it.cerrar) { out.cerrar = true; }
    E.pendiente = it.pend || (it.lead ? "agendar" : null) || (/(agendamos|agendarla|te gustaria agendar|¿la agendamos|¿te la agendo)/i.test(resp) ? "agendar" : (/¿como te llamas|tu nombre\?/i.test(resp) ? "nombre" : ""));
    E.ultimo = it.id; E.temas.push(it.id);
    if (res[1] && res[1].it.rel === undefined && res[1].s > top.s * 0.9) out.rel = out.rel || null;
    return out;
  }

  var API = { _param: function (w, t, sc) { TOPW = w; TOPT = t; TOPS = sc; }, responder: responder, cargar: cargar, estado: function () { return E; }, reiniciar: reiniciar, norm: norm, raices: raices, _puntuar: function (q) { var n = corregirPalabras(norm(q)); return puntuar(corregir(raices(n)), n); }, R: R };
  root.XsellCerebro = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
