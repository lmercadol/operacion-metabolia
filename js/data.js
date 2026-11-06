/* ===========================================================
   OPERACIÓN METABOLIA · contenido de la experiencia
   Fuente: propuesta de gamificación, Guías del recluta (M0–M6,
   Campamento Base, Reactor ATP, Rescate), Guía de pistas,
   textos de Genially y prompts de la Dra. Mito.
   Para editar textos, modifique este archivo.
   =========================================================== */
"use strict";

const BADGES = [
  {id:'catalizador', name:'Catalizador', icon:'⚙️', color:'#22d3ee', type:'Disciplinar · M1', crit:'Nivel «Competente» o superior en la misión de equipo de M1 y reto individual de cierre completado.'},
  {id:'energia', name:'Energía Pura', icon:'⚡', color:'#facc15', type:'Disciplinar · M2', crit:'Nivel «Competente» o superior en la misión de equipo de M2 y reto individual de cierre completado.'},
  {id:'ciclo', name:'Ciclo Cerrado', icon:'♻️', color:'#4ade80', type:'Disciplinar · M3', crit:'Nivel «Competente» o superior en la misión de equipo de M3 y reto individual de cierre completado.'},
  {id:'reserva', name:'Reserva Total', icon:'🛢️', color:'#f59e0b', type:'Disciplinar · M4', crit:'Nivel «Competente» o superior en la misión de equipo de M4 y reto individual de cierre completado.'},
  {id:'logistica', name:'Logística', icon:'🚚', color:'#38bdf8', type:'Disciplinar · M5', crit:'Nivel «Competente» o superior en la misión de equipo de M5 y reto individual de cierre completado.'},
  {id:'antioxidante', name:'Antioxidante', icon:'🛡️', color:'#f472b6', type:'Disciplinar · M6', crit:'Nivel «Competente» o superior en la misión de equipo de M6 y reto individual de cierre completado.'},
  {id:'cazaerrores', name:'Cazaerrores IA', icon:'🔍', color:'#c084fc', type:'Pensamiento crítico', crit:'Identificar y corregir con fuentes todos los errores plantados en una respuesta de IA (Auditoría IA).'},
  {id:'sinergia', name:'Equipo Sinergia', icon:'🤝', color:'#2dd4bf', type:'Colaboración', crit:'Cumplir todos los roles rotativos y entregar los productos de equipo en plazo durante tres misiones.'},
  {id:'explicador', name:'Explicador', icon:'💬', color:'#93c5fd', type:'Pares', crit:'Ayudar a otro equipo con una explicación breve validada por el equipo docente (desde nivel Especialista).'},
  {id:'maestria', name:'Maestría Metabólica', icon:'👑', color:'#ef5a35', type:'Integración', crit:'Alcanzar el nivel «Destacado» en al menos tres criterios de la misión final.'}
];

const LEVELS = [
  {name:'Pasante', min:0, unlock:'Acceso al mapa, a la Dra. Mito y a las misiones.'},
  {name:'Residente', min:150, unlock:'Acceso a las expediciones opcionales y a un comodín de plazo adicional.'},
  {name:'Especialista', min:400, unlock:'Puede ejercer como «Explicador/a» (tutoría a pares) y ganar esa insignia.'},
  {name:'Jefe/a de Nutrición Metabólica', min:650, unlock:'Co-crea un caso para la próxima cohorte y accede a una misión épica opcional.'}
];

const RUBRIC_LEVELS = [
  {id:'D', name:'Destacado', f:1},
  {id:'C', name:'Competente', f:.75},
  {id:'B', name:'Básico', f:.5},
  {id:'I', name:'Insatisfactorio', f:.25}
];

const TEAM_RUBRIC = [
  {name:'Precisión bioquímica', pts:15, d:['Explica la ruta o el mecanismo con exactitud, terminología correcta y relaciones.','Explica correctamente lo principal con imprecisiones menores.','Describe de forma general o con omisiones relevantes.','Presenta errores conceptuales o no explica.']},
  {name:'Razonamiento clínico-nutricional', pts:15, d:['Vincula el mecanismo con el caso y propone recomendaciones alimentarias fundamentadas.','Vincula con el caso con fundamentación parcial.','Vincula de forma superficial.','No vincula con el caso.']},
  {name:'Uso crítico de IA y fuentes', pts:10, d:['Verifica y contrasta con fuentes, corrige errores y declara el uso.','Verifica parcialmente y declara el uso.','Usa la IA sin verificar.','No declara el uso o copia sin análisis.']},
  {name:'Colaboración y comunicación', pts:10, d:['Roles cumplidos, comunicación clara y producto cohesionado.','Roles mayormente cumplidos y comunicación comprensible.','Trabajo desigual o comunicación poco clara.','Producto fragmentado, sin evidencia de trabajo conjunto.']}
];

const FINAL_RUBRIC = [
  {name:'Integración de rutas', pts:15, d:['Conecta rutas entre órganos con flechas y metabolitos correctos.','Conecta la mayoría de las rutas.','Presenta rutas aisladas.','No hay integración.']},
  {name:'Precisión bioquímica', pts:15, d:['Sin errores; terminología exacta.','Imprecisiones menores.','Errores relevantes.','Errores conceptuales graves.']},
  {name:'Estados fisiológicos', pts:15, d:['Explica cómo cambia cada órgano en los 3 estados y por qué.','Explica 2 estados con claridad.','Describe sin explicar.','No distingue estados.']},
  {name:'Regulación hormonal', pts:15, d:['Relaciona hormonas con enzimas y rutas.','Identifica las hormonas por estado.','Menciona hormonas sin relacionarlas.','Omite la regulación.']},
  {name:'Comunicación (visual y explicación)', pts:15, d:['Mapa claro y explicación fluida y precisa.','Comprensible con detalles mejorables.','Confuso en partes.','Difícil de seguir.']},
  {name:'Uso crítico de IA y fuentes', pts:15, d:['Verifica, corrige y declara.','Verifica parcialmente y declara.','Usa sin verificar.','No declara.']}
];

const ROLES = [
  {id:'C', name:'Coordinación', icon:'🧭', d:'Organiza el tiempo, reparte tareas y cuida que el equipo decida en conjunto.'},
  {id:'A', name:'Análisis de datos', icon:'📊', d:'Interpreta tablas, gráficos y valores de laboratorio del caso.'},
  {id:'IA', name:'Especialista en IA', icon:'🤖', d:'Consulta a la Dra. Mito, verifica lo que responde y completa la declaración de uso de IA.'},
  {id:'Co', name:'Comunicación', icon:'📣', d:'Redacta y presenta la solución del equipo en el debriefing.'}
];
const ROTATION = [['C','A','IA','Co','C','A'],['A','IA','Co','C','A','IA'],['IA','Co','C','A','IA','Co'],['Co','C','A','IA','Co','C']];

const PACT = [
  {k:'Declarar', t:'Indicamos en cada producto si usamos IA, para qué y qué verificamos.', i:'📝'},
  {k:'Verificar', t:'Contrastamos todo dato bioquímico con el texto guía o una fuente indicada por el curso.', i:'🔬'},
  {k:'Razonar primero', t:'Intentamos resolver antes de pedir una pista; la IA no resuelve casos evaluados.', i:'🧠'},
  {k:'Proteger datos', t:'No ingresamos información personal ni de personas reales.', i:'🔒'},
  {k:'Responsabilidad compartida', t:'Respondemos por lo que entregamos, aunque lo haya sugerido la IA.', i:'🤝'}
];

const PHASES = [
  {n:'Briefing', w:'Semana A (inicio)', i:'📡', d:'La Dra. Mito presenta el conflicto y el caso.'},
  {n:'Exploración', w:'Semana A', i:'🧭', d:'Estudio guiado con la Dra. Mito y bitácora individual.'},
  {n:'Operación', w:'Semana B (taller evaluado)', i:'🧪', d:'Resolución del caso en equipo con roles; pistas con ATP.'},
  {n:'Debriefing', w:'Semana B (cierre)', i:'🗣️', d:'Errores frecuentes, reto individual y Auditoría IA.'},
  {n:'Informe del Instituto', w:'Semana siguiente', i:'📋', d:'Un logro, una brecha y un siguiente paso.'}
];

const BRIEFING_INICIAL = 'Metabolia es una ciudad que funciona día y noche gracias a sus distritos: la Forja de Enzimas, la Central Energética, la Planta de Reciclaje, los Almacenes de Combustible, la Red de Transporte y el Escudo Antioxidante. Hace unas horas, las luces comenzaron a parpadear. Alguien, o algo, la está saboteando: una enzima que pierde su forma, una reserva de glucosa que no llega, amoníaco acumulándose donde no debe. Los habitantes de Metabolia han empezado a enfermar. Necesitamos reclutas con mente de científicos y corazón de nutricionistas. Su misión: diagnosticar cada falla, explicar qué ocurre a nivel molecular y proponer cómo la alimentación puede ayudar a restablecer el equilibrio.';

/* Expediciones genéricas: recompensas de la Guía M1 */
function exps(a,b,c){return [
  {name:'Explícalo en 60 segundos', icon:'🎙️', text:a, xp:10, atp:5},
  {name:'Mapa en una página', icon:'🗺️', text:b, xp:10, atp:5},
  {name:'Caza de mitos', icon:'🕵️', text:c, xp:10, atp:10}
];}

/* ===========================================================
   MISIONES (orden del mapa)
   =========================================================== */
const MISSIONS = [

/* ---------------------------------------------------------- M0 */
{
  id:'m0', code:'M0', type:'recruit', name:'Reclutamiento', icon:'🎖️', color:'#f59e0b',
  weeks:'Inicio de la semana 3', taller:'Sin nota', unit:'Formación de Laboratorios · diagnóstico · Pacto del Instituto',
  falla:'El Instituto necesita formar equipos para enfrentar el apagón. Formen su Laboratorio, diseñen su escudo y firmen el Pacto del Instituto.',
  briefing:'Bienvenidos, reclutas. Metabolia está en peligro y necesitamos equipos capaces de pensar como científicos y actuar como nutricionistas. Hoy no resolverán ningún caso: hoy formarán su Laboratorio, conocerán las reglas del Instituto y firmarán el pacto que nos protege de las trampas de Entropía. Elijan bien a su equipo: los acompañará todo el semestre.',
  enemy:'Entropía desordena todo lo que toca: inhibe enzimas, bloquea rutas y difunde información falsa, incluso respuestas de IA con errores. Su arma favorita: que dejen de pensar por ustedes mismos.',
  agenda:[
    {a:'Briefing y mapa', min:10, d:'Recorren el mapa de Metabolia y conocen las reglas del Instituto.', xp:'—'},
    {a:'Diagnóstico de ingreso', min:15, d:'Diagnóstico de saberes previos (sin nota). Solo cuenta participar.', xp:'5 XP'},
    {a:'Formar el Laboratorio', min:15, d:'Equipos de 4, nombre, lema y acuerdos de funcionamiento.', xp:'—'},
    {a:'Escudo del Laboratorio', min:20, d:'Diseño del escudo (plantilla de Canva).', xp:'5 XP'},
    {a:'Pacto del Instituto', min:10, d:'Lectura, discusión y firma.', xp:'5 XP'},
    {a:'Primer contacto con la Dra. Mito', min:15, d:'Conversación de prueba y verificación con el texto guía.', xp:'5 XP'}
  ],
  checklist:[
    {id:'diag', t:'Diagnóstico de ingreso respondido', xp:5},
    {id:'escudo', t:'Escudo diseñado y subido', xp:5},
    {id:'pacto', t:'Pacto del Instituto firmado', xp:5},
    {id:'mito', t:'Primera conversación con la Dra. Mito registrada', xp:5}
  ],
  mitoDemo:[
    {who:'est', t:'¿Por qué el almidón y la celulosa son tan diferentes si ambos están hechos de glucosa?'},
    {who:'mito', t:'¡Excelente pregunta para empezar! Antes de explicar: ¿qué saben del enlace que une las glucosas en cada uno? ¿Es el mismo?'},
    {who:'est', t:'Creo que no… ¿uno es alfa y el otro beta?'},
    {who:'mito', t:'¡Van bien encaminados! Pista de nivel 2: piensen en una llave y su cerradura. Nuestras enzimas digestivas (como la amilasa) «encajan» en un tipo de enlace, pero no en el otro. ¿Qué consecuencia tendrá eso para el valor energético de cada uno en nuestra dieta?'},
    {who:'est', t:'Entonces la celulosa no la podemos digerir y por eso es fibra.'},
    {who:'mito', t:'¡Exacto! Ahora explíquenlo con sus palabras y verifiquen en el texto guía qué enlace tiene cada polisacárido (α-1,4 / β-1,4). Pregunta de verificación: ¿por qué el glucógeno se parece más al almidón que a la celulosa?'}
  ],
  riddle:{q:'Tengo tres fosfatos y soy la moneda con la que se paga todo en Metabolia. ¿Quién soy? (3 letras)', a:'ATP', opens:'m1'},
  closing:'¡Bienvenidos al Instituto, reclutas! La primera alarma ya suena en la Forja de Enzimas. La contraseña para entrar está en el acertijo final.'
},

/* ---------------------------------------------------------- M1 */
{
  id:'m1', code:'M1', type:'mission', name:'La Forja de Enzimas', icon:'⚙️', color:'#22d3ee', badge:'catalizador',
  weeks:'Semanas 3 y 4', taller:'Taller N.º 1', unit:'Estructura y función de proteínas y enzimas',
  falla:'Las máquinas de la ciudad se detienen: algunas enzimas pierden su forma y otras fueron inhibidas por una molécula que dejó Entropía.',
  briefing:'Reclutas, tenemos un problema en la Forja: las máquinas se detienen y no sabemos por qué. Una habitante tiene molestias digestivas cada vez que toma leche, y Entropía dejó en la entrada un registro de actividad enzimática con una molécula desconocida. Analícenlo con calma, usen sus pistas con sabiduría y recuerden: en el Instituto no solo importa la respuesta, sino cómo llegan a ella. ¡Que la energía los acompañe!',
  objectives:['Relacionar los niveles de estructura de una proteína con su función.','Interpretar curvas de cinética enzimática (Km, Vmax) e identificar el tipo de inhibición.','Explicar el rol de cofactores y vitaminas en la actividad enzimática.'],
  product:'Informe de diagnóstico enzimático del caso (preguntas 1 a 7) y corrección de la respuesta de IA con errores.',
  cases:[
    {tag:'Habitante 1', title:'Camila, 19 años', icon:'🥛', text:'Camila consulta porque presenta distensión abdominal, gases y deposiciones líquidas entre 30 minutos y 2 horas después de tomar un vaso de leche. Comenta que el yogur y el queso maduro le provocan pocas o ninguna molestia. Evita los lácteos desde hace meses y le preocupa no cubrir su requerimiento de calcio.',
     table:[['Test de hidrógeno espirado (50 g de lactosa)','Positivo: aumento de 38 ppm sobre el basal a los 90 minutos (positivo: ≥ 20 ppm)'],['Ingesta habitual de lácteos','0 a 1 porción al día (antes del inicio de los síntomas: 3 porciones)'],['Otros antecedentes','Sin enfermedades crónicas; no usa medicamentos']]},
    {tag:'Registro de Entropía', title:'La enzima saboteada', icon:'🧪', text:'En el laboratorio de la Forja se midió la velocidad inicial (V₀) de una β-galactosidasa (lactasa) purificada a distintas concentraciones de lactosa, sin y con la «molécula X» que dejó Entropía en concentración constante.',
     head:['[S] lactosa (mM)','V₀ sin inhibidor (µmol/min)','V₀ con molécula X (µmol/min)'],
     rows:[['0,5','20,0','7,7'],['1','33,3','14,3'],['2','50,0','25,0'],['4','66,7','40,0'],['8','80,0','57,1'],['16','88,9','72,7']],
     foot:'Para el análisis: calculen 1/[S] y 1/V₀ y construyan ambos gráficos (Michaelis-Menten y Lineweaver-Burk). Recuerden: 1/V₀ = (Km/Vmax)·(1/[S]) + 1/Vmax.'}
  ],
  parts:[
    {title:'Parte A · La estructura de la máquina', qs:[
      {n:1, text:'La lactasa es una proteína. Describan los cuatro niveles de estructura de las proteínas e indiquen qué tipo de enlaces o interacciones estabilizan cada uno. ¿Qué nivel(es) determinan la forma del sitio activo?'},
      {n:2, text:'Si la lactasa se expusiera a 70 °C o a pH 2, ¿qué ocurriría con su estructura y su actividad? ¿Cambia la secuencia de aminoácidos? Expliquen el concepto de desnaturalización.',
       widget:{type:'choice', prompt:'Verificación rápida: al desnaturalizarse la lactasa…', options:['Se rompen los enlaces peptídicos y cambia la secuencia','Se pierden las estructuras secundaria, terciaria (y cuaternaria); la secuencia (estructura primaria) se mantiene','Solo cambia la Km, pero la forma se conserva','Aumenta su actividad por el calor'], correct:[1], explain:'La desnaturalización rompe interacciones débiles (puentes de hidrógeno, interacciones iónicas e hidrofóbicas) y altera la forma del sitio activo; los enlaces peptídicos (estructura primaria) no se rompen. Error frecuente: creer que la desnaturalización rompe enlaces peptídicos.'}}
    ]},
    {title:'Parte B · El sabotaje de Entropía', qs:[
      {n:3, text:'Con los datos del registro, construyan el gráfico de Michaelis-Menten y el de Lineweaver-Burk para ambas condiciones. Estimen Km y Vmax con y sin la molécula X.',
       hintKey:'Preguntas 3 y 4 · Tipo de inhibición',
       hints:['¿Qué ocurre con la velocidad a concentraciones muy altas de sustrato en ambas curvas? ¿Llegan al mismo valor?','Analogía: si un «impostor» ocupa la cerradura, ¿qué pasa cuando llegan muchísimas llaves verdaderas? Revisen la definición de Km: [S] a la que V₀ = Vmax/2.','Esquema: 1) calculen 1/[S] y 1/V₀; 2) grafiquen ambas series y extrapolen; 3) intercepto en Y = 1/Vmax, intercepto en X = −1/Km; 4) comparen interceptos con y sin la molécula X; 5) apliquen la definición de cada tipo de inhibición.'],
       widget:{type:'kinetics', fields:[
         {label:'Vmax sin molécula X (µmol/min)', answer:100, tol:8},
         {label:'Km sin molécula X (mM)', answer:2, tol:0.3},
         {label:'Vmax con molécula X (µmol/min)', answer:100, tol:8},
         {label:'Km con molécula X (mM)', answer:6, tol:0.7}],
        explain:'Sin inhibidor: 1/Vmax = 0,010 → Vmax = 100 µmol/min; −1/Km = −0,5 → Km = 2 mM. Con molécula X: la recta corta el eje Y en el mismo punto (Vmax = 100 µmol/min) pero el corte en X se acerca a cero (−0,167) → Km aparente = 6 mM.'}},
      {n:4, text:'¿Qué tipo de inhibición produce la molécula X? Justifiquen con lo que observan en los gráficos (punto de corte de las rectas, cambio en Km y Vmax). ¿Cómo podría revertirse este efecto?',
       hintKey:'Preguntas 3 y 4 · Tipo de inhibición',
       widget:{type:'choice', prompt:'La molécula X produce una inhibición…', options:['Competitiva','No competitiva','Acompetitiva','Irreversible'], correct:[0], explain:'Las rectas de Lineweaver-Burk se cortan en el eje 1/V (Vmax sin cambio) y la Km aparente aumenta (2 → 6 mM): inhibición competitiva. Se revierte aumentando la concentración de sustrato, porque el sustrato compite con el inhibidor por el sitio activo.'}}
    ]},
    {title:'Parte C · Del laboratorio a la persona', qs:[
      {n:5, text:'En el caso de Camila, ¿el problema se debe a una inhibición de la lactasa, a un cambio en su Km o a una menor cantidad de enzima en la mucosa intestinal? Expliquen por qué la lactosa no digerida provoca gases y deposiciones líquidas (pista: qué pasa con ella en el colon y qué efecto osmótico tiene).',
       hintKey:'Pregunta 5 · El caso de Camila',
       hints:['En una persona con intolerancia a la lactosa, ¿qué cambia: la enzima, su afinidad o su cantidad?','Concepto: la lactosa que no se absorbe es un soluto que atrae agua y, además, es alimento para las bacterias del colon.','Esquema: menos lactasa en el borde en cepillo → lactosa intacta llega al colon → (a) efecto osmótico → deposiciones líquidas; (b) fermentación → gases y distensión.'],
       widget:{type:'choice', prompt:'El problema de Camila se debe principalmente a…', options:['Una inhibición de la lactasa','Un cambio en la Km de la lactasa','Una menor cantidad de lactasa en el borde en cepillo'], correct:[2], explain:'En la hipolactasia hay menos enzima (menor expresión de lactasa), no un inhibidor ni un cambio de afinidad. Error frecuente: atribuir la intolerancia a una inhibición de la lactasa.'}},
      {n:6, text:'Muchas enzimas necesitan coenzimas derivadas de vitaminas. Elijan dos vitaminas del complejo B, indiquen la coenzima que forman, una reacción o enzima en la que participan y qué consecuencia tendría su déficit.',
       widget:{type:'grid', prompt:'Emparejen cada vitamina con la coenzima que forma.', rows:['B1 · Tiamina','B2 · Riboflavina','B3 · Niacina','B5 · Ácido pantoténico','B6 · Piridoxina'],
        cols:[{name:'Coenzima', options:['TPP (tiamina pirofosfato)','FAD / FMN','NAD⁺ / NADP⁺','Coenzima A','PLP (piridoxal fosfato)']}],
        answers:[['TPP (tiamina pirofosfato)'],['FAD / FMN'],['NAD⁺ / NADP⁺'],['Coenzima A'],['PLP (piridoxal fosfato)']],
        explain:'Ejemplos de reacciones: TPP → piruvato deshidrogenasa; FAD → succinato deshidrogenasa; NAD⁺ → lactato deshidrogenasa y deshidrogenasas en general; CoA → formación de acetil-CoA y acil-CoA; PLP → transaminasas (ALT, AST).'}},
      {n:7, text:'Propongan tres recomendaciones alimentarias para Camila que reduzcan sus síntomas sin comprometer su ingesta de calcio. Expliquen, con bioquímica, por qué el yogur y los quesos maduros se toleran mejor que la leche.',
       hintKey:'Pregunta 7 · Recomendaciones para Camila',
       hints:['¿En qué se diferencian el yogur y el queso maduro de la leche en su contenido de lactosa?','Concepto: la fermentación y la maduración consumen lactosa; algunos cultivos del yogur aportan su propia β-galactosidasa.','Esquema: ajustar porción y frecuencia → elegir lácteos bajos en lactosa o deslactosados → consumirlos acompañados de otros alimentos → identificar otras fuentes de calcio.']}
    ]}
  ],
  audit:{text:'«Un inhibidor competitivo disminuye la Vmax de la enzima y no modifica la Km. Este tipo de inhibición se puede superar aumentando la concentración de sustrato, porque el inhibidor se une al sitio activo. Por otro lado, la intolerancia a la lactosa ocurre porque la lactasa se desnaturaliza al entrar en contacto con la leche fría.»',
    items:[
      {s:'Un inhibidor competitivo disminuye la Vmax de la enzima.', ok:false, fix:'En la inhibición competitiva la Vmax no cambia: con suficiente sustrato se alcanza la misma velocidad máxima.'},
      {s:'El inhibidor competitivo no modifica la Km.', ok:false, fix:'La Km aparente aumenta, porque se necesita más sustrato para alcanzar la mitad de la Vmax.'},
      {s:'Este tipo de inhibición se puede superar aumentando la concentración de sustrato.', ok:true, fix:'Correcto: el sustrato compite con el inhibidor por el sitio activo.'},
      {s:'El inhibidor competitivo se une al sitio activo.', ok:true, fix:'Correcto: es la característica de la inhibición competitiva clásica.'},
      {s:'La intolerancia a la lactosa ocurre porque la lactasa se desnaturaliza al contacto con la leche fría.', ok:false, fix:'Se debe a una menor cantidad de lactasa en el borde en cepillo intestinal (hipolactasia); la temperatura de la leche no desnaturaliza la enzima.'}
    ]},
  errors:['Confundir Km con Vmax.','Creer que la desnaturalización rompe enlaces peptídicos.','Pensar que toda inhibición se revierte con más sustrato.','Atribuir la intolerancia a la lactosa a una inhibición de la lactasa.'],
  ticket:'Un suplemento de lactasa en cápsulas debe tomarse junto con la primera porción del lácteo. Explica por qué no sirve tomarlo tres horas antes de la comida y qué podría ocurrir con la enzima si la cápsula se disolviera en el estómago (pH cercano a 2) sin ninguna protección.',
  expeditions:exps('Explica en un audio o video de 60 segundos qué significa la Km y por qué una Km baja indica alta afinidad.','Resume en una página los cuatro niveles de estructura proteica con un ejemplo de alimento o proteína dietaria.','Verifica con dos fuentes la afirmación «la leche sin lactosa tiene menos calcio y proteínas que la leche común».'),
  riddle:{q:'Soy el tipo de inhibición que desaparece cuando llegan muchas moléculas de sustrato. (11 letras)', a:'COMPETITIVA', opens:'m2'},
  closing:'¡Buen trabajo, reclutas! Las máquinas de la Forja vuelven a moverse. Pero escuchamos un zumbido extraño en la Central Energética… Descansen: la próxima misión llegará pronto.'
},

/* ---------------------------------------------------------- M2 */
{
  id:'m2', code:'M2', type:'mission', name:'La Central Energética', icon:'⚡', color:'#facc15', badge:'energia',
  weeks:'Semanas 5 y 6', taller:'Taller N.º 2', unit:'Metabolismo energético. Metabolismo de carbohidratos',
  falla:'Un apagón deja a los distritos sin ATP: la glucosa no llega donde se necesita o no logra entrar a las células.',
  briefing:'Reclutas, la Central Energética está fallando. Hay dos habitantes afectados: un maratonista que se desplomó a mitad de carrera y una vecina cuya glucosa en sangre no baja, aunque come «como siempre». Entropía está jugando con el flujo de glucosa entre el hígado, el músculo y la sangre. Necesito que sigan cada molécula de glucosa: de dónde viene, a dónde va y qué hormona da las órdenes.',
  objectives:['Explicar la glucólisis, la gluconeogénesis y el metabolismo del glucógeno.','Relacionar la insulina y el glucagón con los estados alimentado y de ayuno.','Vincular la disponibilidad de glucosa con la generación de ATP.'],
  product:'Mapa de flujo de glucosa en dos escenarios (ejercicio prolongado y diabetes tipo 2).',
  cases:[
    {tag:'Habitante 2', title:'Tomás, 28 años, maratonista', icon:'🏃', text:'Tomás corrió su primera maratón. Para no «sentirse pesado», desayunó solo un café negro y durante la carrera tomó únicamente agua. Cerca del kilómetro 32 sintió una fatiga súbita, piernas pesadas y mareo; su ritmo cayó cerca de un 25 %. Los corredores llaman a esto «chocar contra el muro».',
     table:[['Peso','68 kg'],['Tiempo al kilómetro 30','2 h 25 min'],['Glucemia capilar antes de la largada','92 mg/dL'],['Glucemia capilar en el kilómetro 32','61 mg/dL'],['Alimentación 48 h previas','Habitual; sin aumento de carbohidratos']]},
    {tag:'Habitante 3', title:'Rosa, 54 años', icon:'🍞', text:'Rosa tiene diabetes tipo 2 diagnosticada hace tres años. Desayuna pan blanco con mermelada y jugo de fruta; almuerza arroz o papas con carne y bebe dos vasos de bebida azucarada al día. Camina poco por dolor de rodillas.',
     table:[['IMC','31 kg/m²'],['Glucemia en ayunas','148 mg/dL'],['Glucemia 2 h posprandial','215 mg/dL'],['Hemoglobina glicada (HbA1c)','7,6 %'],['Insulina en ayunas','24 µU/mL (elevada para su glucemia)']]}
  ],
  parts:[
    {title:'Parte A · La central por dentro', qs:[
      {n:1, text:'Describan las dos fases de la glucólisis: dónde ocurre, cuántos ATP se invierten y se generan, cuántos NADH se producen y cuál es el rendimiento neto. ¿Qué destino tiene el piruvato en condiciones aeróbicas y anaeróbicas?',
       widget:{type:'numeric', prompt:'Contabilidad de la glucólisis (por molécula de glucosa):', fields:[
         {label:'ATP invertidos (fase preparatoria)', answer:2, tol:0},
         {label:'ATP generados (fase de beneficio)', answer:4, tol:0},
         {label:'NADH producidos', answer:2, tol:0},
         {label:'Rendimiento neto de ATP', answer:2, tol:0}],
        explain:'La glucólisis ocurre en el citosol: se invierten 2 ATP (hexoquinasa y PFK-1) y se generan 4 ATP (fosfoglicerato quinasa y piruvato quinasa) y 2 NADH. Neto: 2 ATP. Aerobiosis: piruvato → acetil-CoA (mitocondria). Anaerobiosis: piruvato → lactato, regenerando NAD⁺.'}},
      {n:2, text:'El glucógeno del hígado y el del músculo tienen funciones distintas. ¿Por qué el glucógeno muscular no puede aportar glucosa a la sangre? (pista: una enzima que el músculo no tiene).',
       widget:{type:'choice', prompt:'La enzima que le falta al músculo es…', options:['Glucógeno fosforilasa','Glucosa-6-fosfatasa','Hexoquinasa','Fosfoglucomutasa'], correct:[1], explain:'Sin glucosa-6-fosfatasa, el músculo no puede desfosforilar la glucosa-6-fosfato: la usa en su propia glucólisis y no la libera a la sangre. El hígado sí tiene esta enzima.'}}
    ]},
    {title:'Parte B · El maratonista que chocó contra el muro', qs:[
      {n:3, text:'Expliquen bioquímicamente qué le ocurrió a Tomás cerca del kilómetro 32. Consideren las reservas de glucógeno, la glucemia y la velocidad con que se obtiene ATP a partir de glucosa versus ácidos grasos.',
       hintKey:'Pregunta 3 · El muro de Tomás',
       hints:['¿Cuánto glucógeno almacenan aproximadamente el músculo y el hígado, y cuánto dura en un esfuerzo prolongado?','Concepto: los ácidos grasos rinden más ATP por gramo, pero lo entregan más lentamente que la glucosa.','Esquema: desayuno escaso + sin carbohidratos en carrera → glucógeno ↓ → glucemia ↓ → más dependencia de grasas → ATP por minuto ↓ → ritmo ↓.']},
      {n:4, text:'¿Qué sustratos usa el hígado para la gluconeogénesis durante el ejercicio prolongado? Expliquen el ciclo de Cori y el ciclo glucosa-alanina. ¿Por qué la gluconeogénesis no alcanzó a evitar la caída de glucemia de Tomás?',
       hintKey:'Pregunta 4 · Gluconeogénesis',
       hints:['¿Qué moléculas llegan al hígado desde un músculo que trabaja intensamente?','Analogía: el ciclo de Cori es un «reciclaje» del lactato que le cuesta energía al hígado.','Esquema: músculo: glucosa → lactato y alanina → sangre → hígado: lactato/alanina → piruvato → glucosa → sangre. Comparen la velocidad del proceso con el gasto de glucosa de la carrera.'],
       widget:{type:'choice', multi:true, prompt:'Marquen TODOS los sustratos gluconeogénicos (seleccione varios).', options:['Lactato','Alanina','Glicerol','Ácidos grasos de cadena par','Acetil-CoA'], correct:[0,1,2], explain:'Lactato (ciclo de Cori), alanina (ciclo glucosa-alanina) y glicerol (de la lipólisis) son gluconeogénicos. Los ácidos grasos de cadena par y el acetil-CoA no pueden formar glucosa neta: la piruvato deshidrogenasa es irreversible.'}}
    ]},
    {title:'Parte C · La glucosa que no baja', qs:[
      {n:5, text:'Completen la tabla sobre la acción de la insulina y el glucagón en el hígado y en el músculo.',
       widget:{type:'grid', rows:['Glucogenogénesis hepática','Glucogenólisis hepática','Gluconeogénesis hepática','Captación de glucosa en músculo (GLUT4)'],
        cols:[{name:'Insulina', options:['↑','↓','sin efecto']},{name:'Glucagón', options:['↑','↓','sin efecto']}],
        answers:[['↑','↓'],['↓','↑'],['↓','↑'],['↑','sin efecto']],
        explain:'La insulina «guarda»: activa la glucógeno sintasa y la translocación de GLUT4 en músculo y tejido adiposo. El glucagón «moviliza»: activa glucogenólisis y gluconeogénesis hepáticas; el músculo no tiene receptores de glucagón.'}},
      {n:6, text:'Rosa tiene insulina elevada y, aun así, glucemia alta en ayunas y después de comer. Expliquen qué es la resistencia a la insulina y cómo afecta la captación muscular de glucosa y la producción hepática de glucosa.',
       hintKey:'Pregunta 6 · Rosa',
       hints:['¿Qué significa que la insulina esté alta y la glucemia también?','Concepto: resistencia a la insulina = las células responden menos a la misma señal hormonal.','Esquema: músculo: menos GLUT4 en la membrana → menor captación; hígado: la insulina no frena la gluconeogénesis ni la glucogenólisis → más glucosa liberada → hiperglucemia en ayunas y posprandial.']},
      {n:7, text:'Propongan recomendaciones alimentarias fundamentadas: dos para la próxima maratón de Tomás (antes y durante la carrera) y tres para Rosa (tipo, cantidad y distribución de carbohidratos).'}
    ]}
  ],
  audit:{text:'«Durante el ayuno, el glucógeno muscular se degrada y libera glucosa a la sangre para mantener la glucemia. La glucólisis tiene un rendimiento neto de 2 ATP por molécula de glucosa. El glucagón estimula la gluconeogénesis en el hígado. Por su parte, la insulina activa la glucógeno fosforilasa para favorecer el almacenamiento de glucosa.»',
    items:[
      {s:'Durante el ayuno, el glucógeno muscular libera glucosa a la sangre para mantener la glucemia.', ok:false, fix:'El músculo carece de glucosa-6-fosfatasa: usa su glucógeno para su propia glucólisis. Es el glucógeno hepático el que mantiene la glucemia.'},
      {s:'La glucólisis tiene un rendimiento neto de 2 ATP por molécula de glucosa.', ok:true, fix:'Correcto: se invierten 2 y se generan 4 ATP.'},
      {s:'El glucagón estimula la gluconeogénesis en el hígado.', ok:true, fix:'Correcto: es la principal hormona hiperglucemiante en ayuno.'},
      {s:'La insulina activa la glucógeno fosforilasa para favorecer el almacenamiento de glucosa.', ok:false, fix:'La insulina activa la glucógeno sintasa e inhibe la glucógeno fosforilasa (la fosforilasa degrada glucógeno).'}
    ]},
  errors:['Creer que el glucógeno muscular eleva la glucemia.','Confundir glucogenólisis con gluconeogénesis.','Pensar que los ácidos grasos generan glucosa.','Afirmar que la insulina activa la glucógeno fosforilasa.'],
  ticket:'Durante una sesión de sprints de 30 segundos, la concentración de lactato en sangre aumenta mucho. Explica por qué el músculo produce lactato en este tipo de ejercicio, qué ventaja tiene regenerar NAD⁺ y qué hace el hígado con ese lactato.',
  expeditions:exps('Explica en 60 segundos por qué el cerebro depende tanto de la glucemia durante el ayuno.','Dibuja en una página el destino de la glucosa en hígado y músculo en estado alimentado y en ayuno.','Verifica con dos fuentes la afirmación «el azúcar de la fruta es igual de dañino que el de las bebidas azucaradas».'),
  riddle:{q:'Soy la hormona que, en ayuno, ordena al hígado fabricar y liberar glucosa. (8 letras, sin tilde)', a:'GLUCAGON', opens:'m3'},
  closing:'¡La Central vuelve a producir energía! Sin embargo, en la Planta de Reciclaje empezó a sentirse un olor extraño… Prepárense.'
},

/* ---------------------------------------------------------- M3 */
{
  id:'m3', code:'M3', type:'mission', name:'La Planta de Reciclaje', icon:'♻️', color:'#4ade80', badge:'ciclo',
  weeks:'Semanas 7 y 8', taller:'Taller N.º 3', unit:'Metabolismo energético del nitrógeno',
  falla:'El amoníaco se acumula y envenena el distrito, mientras algunos habitantes pierden masa muscular sin saberlo.',
  briefing:'Reclutas, la Planta de Reciclaje de nitrógeno está colapsada. En un extremo de la ciudad, un adulto mayor que vive solo está perdiendo peso y fuerza; en el otro, un vecino con un hígado dañado llegó confundido después de un asado familiar. Entropía bloqueó los conductos por donde el nitrógeno debe salir de la ciudad. Sigan cada átomo de nitrógeno: de la proteína del plato hasta la urea de la orina.',
  objectives:['Describir la transaminación, la desaminación y el ciclo de la urea.','Calcular e interpretar un balance nitrogenado.','Relacionar alteraciones del metabolismo del nitrógeno con consideraciones dietéticas.'],
  product:'Ficha de caso con balance nitrogenado y recomendación alimentaria fundamentada.',
  cases:[
    {tag:'Habitante 4', title:'Don Ernesto, 78 años', icon:'👴', text:'Don Ernesto vive solo desde que enviudó. Le cuesta masticar la carne, así que almuerza sopa, pan y té. Su hija nota que perdió fuerza para subir escaleras.',
     table:[['Peso / talla','62 kg / 1,65 m'],['Pérdida de peso','4 kg en los últimos 6 meses'],['Ingesta de proteínas (recordatorio de 24 h)','37 g/día'],['Nitrógeno ureico urinario (NUU, orina de 24 h)','6,0 g/día'],['Albúmina sérica','3,4 g/dL']],
     foot:'Fórmula de trabajo: Balance de N (g/día) = [proteína ingerida (g) ÷ 6,25] − [NUU (g) + 4]. El factor 4 estima las pérdidas por heces, piel y nitrógeno urinario no ureico.'},
    {tag:'Habitante 5', title:'Don Julio, 60 años', icon:'🍖', text:'Don Julio tiene cirrosis hepática. Tras un asado familiar en el que comió cerca de 400 g de carne, su familia lo notó somnoliento y desorientado. En urgencias se observa temblor de aleteo en las manos (asterixis).',
     table:[['Amonio plasmático','115 µmol/L (referencia del laboratorio: 11 a 50 µmol/L)'],['Albúmina sérica','2,9 g/dL'],['Diagnóstico de urgencias','Encefalopatía hepática']]}
  ],
  parts:[
    {title:'Parte A · Cómo se recicla el nitrógeno', qs:[
      {n:1, text:'Expliquen la transaminación: qué enzimas participan (den dos ejemplos), qué coenzima requieren y de qué vitamina proviene. ¿Por qué el α-cetoglutarato y el glutamato son centrales en este proceso?',
       widget:{type:'choice', prompt:'Las transaminasas (ALT, AST) requieren la coenzima…', options:['TPP, derivada de la vitamina B1','PLP, derivada de la vitamina B6','FAD, derivada de la vitamina B2','Biotina (vitamina B7)'], correct:[1], explain:'Las aminotransferasas usan piridoxal fosfato (PLP), derivado de la vitamina B6. El α-cetoglutarato recibe el grupo amino y se convierte en glutamato, que «concentra» el nitrógeno de muchos aminoácidos.'}},
      {n:2, text:'El amonio es tóxico. ¿Cómo se libera a partir del glutamato y cómo se transporta desde el músculo y otros tejidos hasta el hígado? (pista: dos aminoácidos «camión»).',
       widget:{type:'choice', multi:true, prompt:'¿Cuáles son los dos aminoácidos «camión»? (seleccione dos)', options:['Glutamina','Alanina','Aspartato','Arginina','Ornitina'], correct:[0,1], explain:'La glutamina (desde la mayoría de los tejidos) y la alanina (desde el músculo, ciclo glucosa-alanina) transportan el nitrógeno al hígado. El glutamato libera NH₄⁺ por desaminación oxidativa (glutamato deshidrogenasa).'}},
      {n:3, text:'Describan el ciclo de la urea: en qué órgano y compartimentos celulares ocurre, de dónde proviene cada átomo de nitrógeno de la urea, cuál es su costo energético y cómo se conecta con el ciclo de Krebs.',
       hintKey:'Pregunta 3 · Ciclo de la urea',
       hints:['¿En qué órgano están todas las enzimas del ciclo de la urea?','Concepto: el ciclo comienza en la mitocondria y termina en el citosol; un nitrógeno entra como carbamoil fosfato y el otro desde el aspartato.','Esquema: NH₄⁺ + CO₂ → carbamoil fosfato → citrulina → argininosuccinato → arginina → urea + ornitina; el fumarato liberado conecta con el ciclo de Krebs.'],
       widget:{type:'order', prompt:'Ordenen las moléculas del ciclo de la urea, desde la entrada del nitrógeno.', items:['NH₄⁺ + CO₂ → carbamoil fosfato','Citrulina','Argininosuccinato (entra el aspartato)','Arginina (sale fumarato)','Urea + ornitina'], explain:'Mitocondria: carbamoil fosfato y citrulina. Citosol: argininosuccinato, arginina y urea. Costo: 3 ATP (4 enlaces de alta energía). El fumarato conecta con el ciclo de Krebs.'}}
    ]},
    {title:'Parte B · Don Ernesto', qs:[
      {n:4, text:'Calculen el balance nitrogenado de don Ernesto (muestren el desarrollo). ¿Qué significa el resultado en términos de su masa muscular? Compárenlo con la ingesta de proteínas que se suele recomendar para personas mayores (expresada en g/kg/día).',
       hintKey:'Pregunta 4 · Balance de don Ernesto',
       hints:['¿Cuánto nitrógeno contienen, en promedio, las proteínas?','Concepto: balance = lo que entra − lo que sale. ¿Qué significa un resultado negativo para la masa muscular?','Esquema: N ingerido = proteína ÷ 6,25 → N eliminado = NUU + 4 → restar → interpretar el signo → comparar la ingesta con las recomendaciones en g/kg/día para personas mayores.'],
       widget:{type:'numeric', prompt:'Calculadora del balance (redondeen a 2 decimales):', fields:[
         {label:'N ingerido (g/día)', answer:5.92, tol:0.05},
         {label:'N eliminado (g/día)', answer:10, tol:0.05},
         {label:'Balance nitrogenado (g/día)', answer:-4.08, tol:0.06},
         {label:'Ingesta proteica (g/kg/día)', answer:0.6, tol:0.03}],
        explain:'37 ÷ 6,25 = 5,92 g N; 6,0 + 4 = 10,0 g N; balance = 5,92 − 10 = −4,08 g/día (negativo: catabolismo neto, pérdida de masa muscular). Ingesta: 37 ÷ 62 ≈ 0,60 g/kg/día, bajo lo que suele recomendarse para personas mayores (≈ 1,0–1,2 g/kg/día).'}}
    ]},
    {title:'Parte C · Don Julio', qs:[
      {n:5, text:'Expliquen por qué la comida hiperproteica elevó el amonio de don Julio y cómo el exceso de amonio puede alterar la función cerebral (consideren la glutamina en los astrocitos y la disponibilidad de α-cetoglutarato).',
       hintKey:'Pregunta 5 · Don Julio',
       hints:['¿Qué hace normalmente el hígado con el amonio y qué pasa si ese órgano falla?','Concepto: el cerebro se defiende del amonio formando glutamina en los astrocitos.','Esquema: comida hiperproteica → aminoácidos ↑ → NH₄⁺ ↑ → el hígado no forma urea → el NH₄⁺ llega al cerebro → glutamina ↑ (edema) y α-cetoglutarato ↓ (menos energía) → confusión.']},
      {n:6, text:'Propongan recomendaciones alimentarias para ambos habitantes. Para don Julio, investiguen qué dicen las guías clínicas actuales sobre la cantidad de proteínas en la cirrosis y cómo conviene distribuirlas durante el día. Citen la fuente.'}
    ]}
  ],
  audit:{text:'«El ciclo de la urea ocurre principalmente en el riñón, que es el órgano encargado de eliminar el nitrógeno. Los dos átomos de nitrógeno de la urea provienen del amonio libre y del aspartato. La transaminación requiere piridoxal fosfato, derivado de la vitamina B6. Por eso, a toda persona con cirrosis se le debe restringir de forma estricta la proteína de la dieta para prevenir la encefalopatía.»',
    items:[
      {s:'El ciclo de la urea ocurre principalmente en el riñón.', ok:false, fix:'Ocurre en el hígado (mitocondria y citosol del hepatocito). El riñón solo excreta la urea.'},
      {s:'Los dos átomos de nitrógeno de la urea provienen del amonio libre y del aspartato.', ok:true, fix:'Correcto: uno entra como carbamoil fosfato (desde NH₄⁺) y el otro desde el aspartato.'},
      {s:'La transaminación requiere piridoxal fosfato, derivado de la vitamina B6.', ok:true, fix:'Correcto.'},
      {s:'A toda persona con cirrosis se le debe restringir de forma estricta la proteína.', ok:false, fix:'Las guías actuales (p. ej., ESPEN 2019, EASL 2019) no recomiendan restricción proteica: sugieren ≈ 1,2–1,5 g/kg/día, distribuida durante el día y con colación nocturna, para evitar la sarcopenia.'}
    ]},
  errors:['Ubicar el ciclo de la urea en el riñón.','Creer que el exceso de proteína se almacena.','Recomendar restricción proteica estricta en toda cirrosis.','Olvidar el factor 6,25.'],
  ticket:'Un estudiante pasa de consumir 0,8 a 2,2 g de proteína por kg al día con suplementos, sin cambiar su entrenamiento. ¿Qué ocurre con la producción de urea y por qué? ¿El organismo puede almacenar el exceso de aminoácidos como lo hace con la glucosa o las grasas? Explica qué destino tienen sus esqueletos carbonados.',
  expeditions:exps('Explica en 60 segundos por qué la urea se produce en el hígado pero se elimina por el riñón.','Dibuja en una página el viaje de un nitrógeno desde una proteína de la leche hasta la orina.','Verifica con dos fuentes la afirmación «comer mucha proteína daña los riñones de las personas sanas».'),
  riddle:{q:'Salgo del ciclo de la urea y entro al ciclo de Krebs. (8 letras)', a:'FUMARATO', opens:'m4'},
  closing:'¡La Planta de Reciclaje vuelve a funcionar! Pero los Almacenes de Combustible reportan reservas desordenadas… Entropía no descansa.'
},

/* ---------------------------------------------------------- M4 */
{
  id:'m4', code:'M4', type:'mission', name:'Los Almacenes de Combustible', icon:'🛢️', color:'#f59e0b', badge:'reserva',
  weeks:'Semanas 9 y 10', taller:'Taller N.º 4', unit:'Metabolismo energético. Metabolismo de lípidos',
  falla:'Las reservas de grasa están mal administradas: el combustible no se libera cuando hace falta o se acumula cuando sobra.',
  briefing:'Reclutas, los Almacenes de Combustible son la reserva más grande de Metabolia, pero Entropía alteró sus horarios. Tres habitantes llegan al Instituto: una joven que sigue una dieta cetogénica, un hombre en ayuno prolongado y una mujer que almacena grasa sin parar. Su tarea es descubrir qué rutas están encendidas o apagadas en cada uno y por qué.',
  objectives:['Explicar la β-oxidación, la cetogénesis y la lipogénesis y su regulación.','Comparar el estado alimentado, el ayuno prolongado y la dieta cetogénica.'],
  product:'Cuadro comparativo de rutas lipídicas según el estado metabólico.',
  cases:[
    {tag:'Habitante 6', title:'Valentina, 23 años · dieta cetogénica', icon:'🥑', text:'Valentina sigue hace tres semanas una dieta cetogénica que vio en redes sociales: unos 25 g de carbohidratos al día y cerca del 70 % de la energía como grasa. La primera semana tuvo dolor de cabeza y cansancio; ahora se siente bien, pero su pareja nota un aliento «afrutado».',
     table:[['Glucemia','82 mg/dL'],['β-hidroxibutirato capilar','1,8 mmol/L'],['pH sanguíneo','Normal']]},
    {tag:'Habitante 7', title:'Martín, 35 años · ayuno de 72 horas', icon:'⏳', text:'Martín participa en un estudio supervisado de ayuno de 72 horas (solo agua).',
     table:[['Glucemia (72 h)','65 mg/dL'],['β-hidroxibutirato (72 h)','3,5 mmol/L'],['Ácidos grasos libres plasmáticos','Elevados'],['pH sanguíneo','7,38']]},
    {tag:'Habitante 8', title:'Ana, 40 años · exceso energético', icon:'🍪', text:'Ana consume a diario más energía de la que gasta, principalmente como pan, galletas y bebidas azucaradas, y su dieta es baja en grasa. Ha subido 6 kg en un año y sus triglicéridos plasmáticos son de 190 mg/dL.'}
  ],
  parts:[
    {title:'Parte A · Abrir y cerrar los almacenes', qs:[
      {n:1, text:'Expliquen cómo se movilizan los triglicéridos del tejido adiposo: qué enzimas participan, qué hormonas activan o frenan la lipólisis y qué destino tienen el glicerol y los ácidos grasos liberados.'},
      {n:2, text:'¿Cómo entran los ácidos grasos de cadena larga a la mitocondria? Expliquen el rol de la carnitina y por qué la malonil-CoA impide que se oxiden ácidos grasos al mismo tiempo que se sintetizan.',
       widget:{type:'choice', prompt:'La malonil-CoA inhibe a la enzima…', options:['Acetil-CoA carboxilasa','Carnitina palmitoiltransferasa I (CPT-I)','Lipasa sensible a hormonas','HMG-CoA sintasa'], correct:[1], explain:'La malonil-CoA (primer intermediario de la lipogénesis) inhibe la CPT-I, que permite la entrada de acil-CoA de cadena larga a la mitocondria. Así se evita sintetizar y oxidar ácidos grasos al mismo tiempo.'}},
      {n:3, text:'Describan las cuatro reacciones de una vuelta de β-oxidación. Luego calculen el rendimiento neto de ATP de la oxidación completa de un palmitato (16 C), mostrando el desarrollo (usen 2,5 ATP por NADH, 1,5 por FADH₂ y 10 por acetil-CoA oxidado en el ciclo de Krebs).',
       hintKey:'Pregunta 3 · ATP del palmitato',
       hints:['¿Cuántos carbonos tiene el palmitato y cuántos acetil-CoA puede formar?','Concepto: el número de vueltas de β-oxidación es uno menos que el número de acetil-CoA formados.','Esquema: vueltas = 7 → acetil-CoA = 8 → sumen el ATP de los FADH₂, los NADH y los acetil-CoA → resten el costo de activación (equivalente a 2 ATP).'],
       widget:{type:'numeric', prompt:'Contabilidad del palmitato (16 C):', fields:[
         {label:'Vueltas de β-oxidación', answer:7, tol:0},
         {label:'Acetil-CoA formados', answer:8, tol:0},
         {label:'FADH₂ + NADH formados (total)', answer:14, tol:0},
         {label:'ATP neto', answer:106, tol:0}],
        explain:'Oxidación (deshidrogenación con FAD), hidratación, oxidación (NAD⁺) y tiólisis. 7 FADH₂ × 1,5 = 10,5; 7 NADH × 2,5 = 17,5; 8 acetil-CoA × 10 = 80 → 108 ATP − 2 (activación) = 106 ATP.'}}
    ]},
    {title:'Parte B · Cuerpos cetónicos', qs:[
      {n:4, text:'Expliquen dónde y por qué se forman los cuerpos cetónicos en Valentina y en Martín (pista: qué pasa con el oxalacetato cuando el hígado hace gluconeogénesis). ¿Por qué el hígado los produce pero no puede usarlos? ¿Qué tejidos sí los usan?',
       hintKey:'Pregunta 4 · Cuerpos cetónicos',
       hints:['¿Qué molécula necesita el acetil-CoA para entrar al ciclo de Krebs?','Concepto: si el hígado usa el oxalacetato para fabricar glucosa, el acetil-CoA se acumula.','Esquema: β-oxidación hepática ↑ + oxalacetato desviado a gluconeogénesis → acetil-CoA ↑ → acetoacetato y β-hidroxibutirato → sangre → músculo, corazón y cerebro (el hígado no los usa porque le falta una enzima: la tioforasa).']},
      {n:5, text:'Diferencien la cetosis nutricional de Valentina de una cetoacidosis diabética: valores aproximados de cuerpos cetónicos, pH, papel de la insulina y riesgo para la persona.',
       widget:{type:'grid', prompt:'Clasifiquen cada característica.', rows:['β-hidroxibutirato ≈ 0,5 a 3 mmol/L','Cuerpos cetónicos muy elevados (sobre 3 mmol/L; pueden superar 10)','pH sanguíneo normal','pH bajo (acidosis metabólica)','Hay insulina (baja pero presente) que frena la lipólisis','Déficit grave de insulina: lipólisis y cetogénesis sin freno','Generalmente sin riesgo vital en personas sanas','Emergencia médica'],
        cols:[{name:'Corresponde a', options:['Cetosis nutricional','Cetoacidosis diabética']}],
        answers:[['Cetosis nutricional'],['Cetoacidosis diabética'],['Cetosis nutricional'],['Cetoacidosis diabética'],['Cetosis nutricional'],['Cetoacidosis diabética'],['Cetosis nutricional'],['Cetoacidosis diabética']],
        explain:'La clave es la insulina: aunque baja, en la cetosis nutricional frena la lipólisis y limita la producción de cetonas. En la cetoacidosis diabética el déficit de insulina deja la cetogénesis sin control y el pH cae.'}}
    ]},
    {title:'Parte C · El cuadro de los almacenes', qs:[
      {n:6, text:'Completen el cuadro indicando si cada ruta está aumentada (↑), disminuida (↓) o sin mayor cambio (=), y la hormona que predomina. Justifiquen al menos una celda de cada columna.',
       hintKey:'Pregunta 6 · Cuadro de los almacenes',
       hints:['¿Qué hormona predomina después de comer y cuál en ayuno?','Concepto: la insulina «guarda» y el glucagón «moviliza»; la malonil-CoA impide oxidar y sintetizar ácidos grasos al mismo tiempo.','Esquema: para cada habitante identifiquen insulina/glucagón → decidan si los almacenes se llenan o se vacían → marquen ↑/↓ en cada ruta de forma coherente con esa decisión.'],
       widget:{type:'grid', rows:['Lipólisis','β-oxidación','Cetogénesis','Lipogénesis','Hormona predominante'],
        cols:[{name:'Alimentado (Ana)', options:['↑','↓','=','Insulina','Glucagón']},{name:'Ayuno 72 h (Martín)', options:['↑','↓','=','Insulina','Glucagón']},{name:'Cetogénica (Valentina)', options:['↑','↓','=','Insulina','Glucagón']}],
        answers:[['↓','↑','↑'],['↓','↑','↑'],['↓','↑','↑'],['↑','↓','↓'],['Insulina','Glucagón','Glucagón']],
        explain:'Ana: insulina alta → lipogénesis ↑ y movilización ↓. Martín y Valentina: insulina baja / glucagón relativo alto → lipólisis, β-oxidación y cetogénesis ↑; lipogénesis ↓ (en Valentina la cetosis es más moderada que en Martín).'}},
      {n:7, text:'Ana come poca grasa y, aun así, aumenta su grasa corporal y sus triglicéridos. Expliquen cómo los carbohidratos en exceso se convierten en ácidos grasos (enzima clave, compartimento celular, origen del NADPH) y propongan dos recomendaciones alimentarias para ella y dos para Valentina.'}
    ]}
  ],
  audit:{text:'«La β-oxidación de los ácidos grasos ocurre en el citosol de la célula. El hígado produce cuerpos cetónicos, pero no puede utilizarlos como combustible. Durante el ayuno, los ácidos grasos se convierten en glucosa mediante la gluconeogénesis, lo que permite mantener la glucemia. Finalmente, la insulina estimula la lipogénesis y frena la lipólisis.»',
    items:[
      {s:'La β-oxidación de los ácidos grasos ocurre en el citosol.', ok:false, fix:'Ocurre en la matriz mitocondrial (las cadenas muy largas se acortan primero en los peroxisomas). La lipogénesis es la que ocurre en el citosol.'},
      {s:'El hígado produce cuerpos cetónicos, pero no puede utilizarlos.', ok:true, fix:'Correcto: le falta la tioforasa (succinil-CoA:3-cetoácido CoA transferasa).'},
      {s:'Durante el ayuno, los ácidos grasos se convierten en glucosa mediante la gluconeogénesis.', ok:false, fix:'Los ácidos grasos de cadena par no forman glucosa neta (la piruvato deshidrogenasa es irreversible). Solo el glicerol de los triglicéridos es gluconeogénico.'},
      {s:'La insulina estimula la lipogénesis y frena la lipólisis.', ok:true, fix:'Correcto.'}
    ]},
  errors:['Ubicar la β-oxidación en el citosol.','Afirmar que los ácidos grasos se convierten en glucosa.','Creer que el hígado usa cuerpos cetónicos.','Confundir cetosis nutricional con cetoacidosis.'],
  ticket:'Una persona en ayuno de tres días tiene grandes reservas de grasa y, aun así, sigue degradando algo de proteína muscular. Explica por qué ocurre esto (piensa en qué tejidos necesitan glucosa y qué parte de un triglicérido puede transformarse en glucosa) y qué cambio metabólico permite reducir esa pérdida de proteína a medida que el ayuno se prolonga.',
  expeditions:exps('Explica en 60 segundos por qué decimos que «las grasas se queman en la llama de los carbohidratos».','Resume en una página la regulación cruzada entre β-oxidación y lipogénesis (malonil-CoA, insulina, glucagón).','Verifica con dos fuentes la afirmación «la dieta cetogénica quema más grasa que cualquier otra dieta con las mismas calorías».'),
  riddle:{q:'Soy el transportador que lleva a los ácidos grasos de cadena larga al interior de la mitocondria. (9 letras)', a:'CARNITINA', opens:'camp'},
  closing:'¡Los Almacenes vuelven a abrir y cerrar a tiempo! Ahora aprovechen el Campamento Base para reagruparse. Después llegará el tramo final: la Red de Transporte nos preocupa…'
},

/* ---------------------------------------------------------- CAMPAMENTO */
{
  id:'camp', code:'CB', type:'camp', name:'Campamento Base', icon:'⛺', color:'#3ecf8e',
  weeks:'Semana 11', taller:'Consolidación (sin nota)', unit:'Repaso integrador de las misiones 1 a 4',
  falla:'Pausa estratégica: repaso en escape room y reparación de misiones.',
  briefing:'Reclutas, restauraron cuatro distritos, pero Entropía no se rinde. Los encerró en el Campamento Base. Para salir deben demostrar que dominan lo que aprendieron: cuatro candados, uno por distrito. Aprovechen también esta pausa para reparar lo que quedó pendiente. Lo que viene será más difícil.',
  agenda:[
    {a:'Escape room', min:45, d:'Abren los 4 candados.'},
    {a:'Mercado de ATP', min:10, d:'Canjean ATP por pistas o comodines.'},
    {a:'Reparación de misiones', min:30, d:'Autodiagnóstico y plan de refuerzo.'},
    {a:'Bitácora', min:10, d:'Reflexión individual.'}
  ],
  locks:[
    {room:'Sala 1 · La Forja', icon:'⚙️', q:'Una enzima tiene Vmax = 80 µmol/min y Km = 4 mM. ¿Cuál es su velocidad (µmol/min) cuando [S] = 4 mM? Expliquen por qué sin hacer cálculos largos.', a:40, hint:'Recuerden la definición de Km.', explain:'Cuando [S] = Km, V₀ = Vmax/2 = 40 µmol/min.'},
    {room:'Sala 2 · La Central', icon:'⚡', q:'¿Cuántos ATP netos se obtienen en la glucólisis anaeróbica de 3 moléculas de glucosa? ¿Por qué en anaerobiosis no se suman los ATP de la cadena respiratoria?', a:6, hint:'¿Cuánto rinde una glucosa?', explain:'2 ATP netos × 3 glucosas = 6 ATP. Sin O₂ no funciona la cadena respiratoria: el NADH se reoxida formando lactato.'},
    {room:'Sala 3 · La Planta', icon:'♻️', q:'Una persona come 100 g de proteína al día y elimina 9 g de NUU en 24 h. Calculen su balance nitrogenado (g/día) con N = proteína ÷ 6,25 y pérdidas = NUU + 4. ¿Qué significa el resultado?', a:3, hint:'100 ÷ 6,25 = ?', explain:'100 ÷ 6,25 = 16 g N; pérdidas = 9 + 4 = 13 g N; balance = +3 g/día (positivo: anabolismo neto).'},
    {room:'Sala 4 · Los Almacenes', icon:'🛢️', q:'¿Cuántas vueltas de β-oxidación necesita el ácido esteárico (18 C) para convertirse completamente en acetil-CoA? ¿Cuántos acetil-CoA se forman?', a:8, hint:'Vueltas = acetil-CoA − 1', explain:'18 C → 9 acetil-CoA → 8 vueltas.'}
  ],
  combo:'40638',
  connections:['Elijan dos rutas de misiones distintas y expliquen cómo se conectan (por ejemplo: alanina entre M2 y M3, u oxalacetato entre M2 y M4).','Si una persona ayuna 24 horas, ¿qué ocurre en los cuatro distritos al mismo tiempo? Respondan en 4 líneas, una por distrito.'],
  bitacora:['¿Qué distrito domino mejor y cuál me cuesta más?','¿Qué estrategia de estudio voy a cambiar para el tramo final?'],
  note:'«Ya no atacaré los distritos uno por uno. Voy por las rutas que los conectan… y por el reactor.» — Entropía',
  riddle:{opens:'m5'}
},

/* ---------------------------------------------------------- M5 */
{
  id:'m5', code:'M5', type:'mission', name:'La Red de Transporte', icon:'🚚', color:'#38bdf8', badge:'logistica',
  weeks:'Semanas 12 y 13', taller:'Taller N.º 5', unit:'Metabolismo energético. Metabolismo de lipoproteínas',
  falla:'Los «camiones» que transportan lípidos pierden su ruta y el colesterol se acumula en las paredes de las calles de la ciudad.',
  briefing:'Reclutas, bienvenidos al tramo final. Entropía atacó la Red de Transporte: los camiones que llevan grasas por la sangre se están desviando y el colesterol empieza a acumularse donde no debe. Un habitante con antecedentes familiares de infarto acaba de recibir su perfil lipídico y no entiende los números. Su misión es interpretarlo y explicarle qué está pasando con su red de transporte.',
  objectives:['Describir el origen, la composición y el destino de los quilomicrones, VLDL, LDL y HDL.','Interpretar un perfil lipídico y proponer implicancias nutricionales.'],
  product:'Interpretación comentada de un perfil lipídico ficticio.',
  cases:[
    {tag:'Habitante 9', title:'Andrés, 45 años', icon:'🧑‍💼', text:'Andrés trabaja en una oficina y hace poca actividad física. Su padre tuvo un infarto a los 52 años. Come a menudo frituras, embutidos y pasteles; consume pocas frutas, verduras, legumbres y cereales integrales. No fuma.',
     head:['Examen (en ayunas)','Resultado','Valores de referencia orientativos'],
     rows:[['Colesterol total','262 mg/dL','Deseable: < 200 mg/dL'],['Colesterol HDL','38 mg/dL','Bajo en hombres: < 40 mg/dL'],['Triglicéridos','180 mg/dL','Normal: < 150 mg/dL'],['Colesterol LDL','No informado','Óptimo: < 100 mg/dL (la meta depende del riesgo cardiovascular)'],['Glucemia','98 mg/dL','70 a 99 mg/dL']],
     foot:'Fórmula de Friedewald (mg/dL): LDL = colesterol total − HDL − (triglicéridos ÷ 5). Colesterol no-HDL = colesterol total − HDL.'}
  ],
  parts:[
    {title:'Parte A · Los camiones de la ciudad', qs:[
      {n:1, text:'Dibujen y expliquen la estructura general de una lipoproteína: qué lípidos van en el núcleo, qué hay en la superficie y por qué los lípidos necesitan este «camión» para viajar por la sangre.'},
      {n:2, text:'Completen la tabla de las lipoproteínas (origen, lípido principal, apolipoproteína característica y destino o función).',
       hintKey:'Pregunta 2 · Tabla de lipoproteínas',
       hints:['¿Dónde se forma cada lipoproteína: en el intestino o en el hígado?','Concepto: la densidad aumenta cuando sube la proporción de proteína y baja la de triglicéridos.','Esquema: QM (intestino, TG de la dieta) → remanentes → hígado; VLDL (hígado, TG endógenos) → IDL → LDL (colesterol a los tejidos); HDL recoge colesterol de los tejidos → hígado.'],
       widget:{type:'grid', rows:['Quilomicrones','VLDL','IDL','LDL','HDL'],
        cols:[{name:'Origen', options:['Intestino','Hígado','Circulación (desde VLDL)','Circulación (desde IDL)','Hígado e intestino']},
              {name:'Lípido principal', options:['TG de la dieta','TG endógenos','TG y ésteres de colesterol','Ésteres de colesterol','Fosfolípidos y colesterol (recogido)']},
              {name:'Apo característica', options:['Apo B-48','Apo B-100','Apo B-100 y apo E','Apo A-I']}],
        answers:[['Intestino','TG de la dieta','Apo B-48'],['Hígado','TG endógenos','Apo B-100'],['Circulación (desde VLDL)','TG y ésteres de colesterol','Apo B-100 y apo E'],['Circulación (desde IDL)','Ésteres de colesterol','Apo B-100'],['Hígado e intestino','Fosfolípidos y colesterol (recogido)','Apo A-I']],
        explain:'Destinos: QM → entregan TG a músculo y tejido adiposo (LPL); remanentes al hígado. VLDL → TG endógenos a los tejidos; se transforma en IDL y luego LDL. LDL → colesterol a los tejidos (receptor de LDL). HDL → transporte reverso del colesterol hacia el hígado.'}},
      {n:3, text:'Expliquen la función de la lipoproteína lipasa (y de la apo C-II que la activa), del receptor de LDL y de la LCAT. ¿Qué le pasaría a la red si fallara cada una?'}
    ]},
    {title:'Parte B · El perfil de Andrés', qs:[
      {n:4, text:'Calculen el colesterol LDL (Friedewald) y el colesterol no-HDL de Andrés, mostrando el desarrollo. ¿En qué situación no se puede usar la fórmula de Friedewald?',
       hintKey:'Pregunta 4 · Cálculos del perfil',
       hints:['¿Qué datos del perfil lipídico necesitan para la fórmula?','Concepto: «triglicéridos ÷ 5» estima el colesterol que viaja en las VLDL.','Esquema: LDL = CT − HDL − TG/5 → no-HDL = CT − HDL → verifiquen que los TG estén bajo 400 mg/dL.'],
       widget:{type:'numeric', prompt:'Calculadora del perfil (mg/dL):', fields:[
         {label:'Colesterol en VLDL (TG ÷ 5)', answer:36, tol:0},
         {label:'Colesterol LDL (Friedewald)', answer:188, tol:0},
         {label:'Colesterol no-HDL', answer:224, tol:0},
         {label:'Friedewald no es válida con TG ≥ … mg/dL', answer:400, tol:0}],
        explain:'TG ÷ 5 = 180 ÷ 5 = 36; LDL = 262 − 38 − 36 = 188 mg/dL (muy por sobre lo óptimo); no-HDL = 262 − 38 = 224 mg/dL. La fórmula no se usa con TG ≥ 400 mg/dL (ni en muestras no en ayunas).'}},
      {n:5, text:'Interpreten el perfil completo de Andrés: qué valores están alterados, qué lipoproteínas explican cada alteración y por qué su antecedente familiar es relevante.'},
      {n:6, text:'Expliquen el transporte reverso del colesterol y por qué un HDL bajo junto a triglicéridos elevados es un patrón frecuente en personas sedentarias con dieta rica en grasas saturadas y azúcares.'}
    ]},
    {title:'Parte C · Reordenar la red', qs:[
      {n:7, text:'Propongan cuatro recomendaciones alimentarias y de estilo de vida para Andrés, explicando el mecanismo de cada una (por ejemplo: tipo de grasa y receptor de LDL, fibra soluble y ácidos biliares, fitoesteroles, actividad física y HDL).',
       hintKey:'Pregunta 7 · Recomendaciones para Andrés',
       hints:['¿Qué alimentos de la dieta de Andrés aportan grasas saturadas y trans?','Concepto: la fibra soluble atrapa ácidos biliares en el intestino y el hígado usa colesterol para reponerlos.','Esquema: para cada recomendación: alimento → componente → mecanismo (receptor de LDL, ácidos biliares, absorción intestinal, LPL/HDL) → efecto esperado en el perfil.']}
    ]}
  ],
  audit:{text:'«Los quilomicrones se forman en el hígado y transportan principalmente los triglicéridos sintetizados por el organismo. La LDL es la principal transportadora de colesterol hacia los tejidos periféricos. La lipoproteína lipasa, ubicada en el endotelio de los capilares, hidroliza los triglicéridos de los quilomicrones y de las VLDL. La HDL se considera «colesterol bueno» porque transporta colesterol desde el hígado hacia las arterias.»',
    items:[
      {s:'Los quilomicrones se forman en el hígado y transportan los triglicéridos sintetizados por el organismo.', ok:false, fix:'Se forman en el intestino (enterocitos) y transportan los triglicéridos de la dieta (exógenos). Las VLDL son las hepáticas.'},
      {s:'La LDL es la principal transportadora de colesterol hacia los tejidos periféricos.', ok:true, fix:'Correcto.'},
      {s:'La lipoproteína lipasa, en el endotelio capilar, hidroliza los TG de quilomicrones y VLDL.', ok:true, fix:'Correcto (activada por la apo C-II).'},
      {s:'La HDL transporta colesterol desde el hígado hacia las arterias.', ok:false, fix:'Es al revés: la HDL realiza el transporte reverso, desde los tejidos (incluida la pared arterial) hacia el hígado. Además, no hay «colesterol bueno o malo»: hay lipoproteínas con destinos distintos.'}
    ]},
  errors:['Creer que los quilomicrones se forman en el hígado.','Decir que la HDL lleva colesterol a las arterias.','Usar Friedewald con TG ≥ 400 mg/dL.','Hablar de «colesterol bueno y malo» sin mencionar las lipoproteínas.'],
  ticket:'Una muestra de sangre tomada una hora después de una comida muy rica en grasas muestra un plasma de aspecto lechoso. ¿Qué lipoproteína explica este aspecto y de dónde provienen sus lípidos? ¿Por qué tradicionalmente se ha pedido el perfil lipídico en ayunas y qué valor del perfil se ve más afectado por la comida?',
  expeditions:exps('Explica en 60 segundos por qué no existe un «colesterol bueno» y uno «malo», sino lipoproteínas con destinos distintos.','Dibuja en una página el recorrido de una grasa de la dieta: del intestino al tejido adiposo y del hígado al resto del cuerpo.','Verifica con dos fuentes la afirmación «el huevo eleva el colesterol y debe evitarse en personas con colesterol alto».'),
  riddle:{q:'Soy la lipoproteína que devuelve el colesterol de los tejidos al hígado. (3 letras)', a:'HDL', opens:'m6'},
  closing:'¡Los camiones vuelven a sus rutas! Pero en el cielo de Metabolia aparecen chispas… El Escudo Antioxidante está bajo ataque.'
},

/* ---------------------------------------------------------- M6 */
{
  id:'m6', code:'M6', type:'mission', name:'El Escudo Antioxidante', icon:'🛡️', color:'#f472b6', badge:'antioxidante',
  weeks:'Semanas 14 y 15', taller:'Taller N.º 6', unit:'Estrés oxidativo y mecanismos de defensa antioxidante',
  falla:'Una lluvia de «chispas» (especies reactivas) daña las estructuras de la ciudad, y Entropía difunde rumores sobre «superalimentos» y suplementos milagrosos.',
  briefing:'Reclutas, el Escudo Antioxidante de Metabolia está debilitado. Una fumadora tiene sus defensas agotadas y un triatleta cree que tomar puñados de vitaminas lo hará invencible. Para colmo, Entropía está difundiendo mitos sobre los antioxidantes por toda la ciudad. Necesito que entiendan cómo se forman las chispas, cómo se defiende la ciudad y qué dice realmente la evidencia.',
  objectives:['Explicar cómo se generan las especies reactivas y cómo se defiende el organismo.','Relacionar los nutrientes antioxidantes con su función.','Evaluar críticamente afirmaciones sobre «alimentos antioxidantes» y suplementos.'],
  product:'Análisis de un mito alimentario con fuentes y propuesta de menú fundamentado.',
  cases:[
    {tag:'Habitante 10', title:'Sofía, 26 años', icon:'🚬', text:'Sofía fuma 10 cigarrillos al día desde los 17 años. Su alimentación se basa en comida rápida; come fruta una o dos veces por semana y casi no consume verduras ni frutos secos.'},
    {tag:'Habitante 11', title:'Diego, 30 años', icon:'🏊', text:'Diego es triatleta y entrena unas 15 horas a la semana. Para «recuperarse más rápido», toma a diario 1 g de vitamina C y 400 UI de vitamina E en cápsulas, además de su alimentación habitual, que es variada y rica en frutas y verduras.'},
    {tag:'El rumor de Entropía', title:'«Los antioxidantes son siempre buenos»', icon:'📢', text:'«Los antioxidantes son siempre buenos: mientras más suplementos antioxidantes tomes, más sano estarás y mejor rendirás en el deporte. Si fumas, el β-caroteno en cápsulas te protege del cáncer.»', entropia:true}
  ],
  parts:[
    {title:'Parte A · Las chispas', qs:[
      {n:1, text:'Definan especie reactiva de oxígeno y den tres ejemplos (indicando cuáles son radicales libres). Mencionen dos fuentes endógenas y dos exógenas, relacionándolas con Sofía y Diego.',
       widget:{type:'grid', prompt:'¿Cuáles son radicales libres?', rows:['Anión superóxido (O₂•⁻)','Radical hidroxilo (•OH)','Peróxido de hidrógeno (H₂O₂)','Oxígeno singlete (¹O₂)'],
        cols:[{name:'Tipo', options:['Radical libre','No radical']}],
        answers:[['Radical libre'],['Radical libre'],['No radical'],['No radical']],
        explain:'Un radical libre tiene un electrón desapareado. El H₂O₂ y el oxígeno singlete son especies reactivas pero no radicales. Fuentes endógenas: cadena respiratoria (más en el ejercicio intenso de Diego), NADPH oxidasa. Exógenas: humo de cigarrillo (Sofía), contaminación, radiación UV.'}},
      {n:2, text:'Expliquen qué daño pueden causar las especies reactivas en lípidos de membrana, proteínas y ADN. Definan estrés oxidativo como un desequilibrio y mencionen que las especies reactivas también cumplen funciones de señalización.'}
    ]},
    {title:'Parte B · El escudo', qs:[
      {n:3, text:'Completen la tabla de defensas enzimáticas (reacción, mineral o nutriente necesario y ubicación celular).',
       hintKey:'Pregunta 3 · Enzimas antioxidantes',
       hints:['¿Qué sustrato elimina cada enzima y qué producto deja?','Concepto: la SOD y la catalasa trabajan en secuencia; la glutatión peroxidasa usa glutatión y la glutatión reductasa lo recicla con NADPH.','Esquema: O₂•⁻ → (SOD) → H₂O₂ → (catalasa o GPx) → H₂O; GSSG → (GR + NADPH) → GSH. Asocien Cu/Zn/Mn, Fe (hemo), Se y FAD.'],
       widget:{type:'grid', rows:['Superóxido dismutasa','Catalasa','Glutatión peroxidasa','Glutatión reductasa'],
        cols:[{name:'Reacción', options:['O₂•⁻ → H₂O₂ + O₂','2 H₂O₂ → 2 H₂O + O₂','H₂O₂ + 2 GSH → 2 H₂O + GSSG','GSSG + NADPH → 2 GSH']},
              {name:'Mineral / nutriente', options:['Cu/Zn o Mn','Fe (grupo hemo)','Selenio','FAD (vitamina B2)']}],
        answers:[['O₂•⁻ → H₂O₂ + O₂','Cu/Zn o Mn'],['2 H₂O₂ → 2 H₂O + O₂','Fe (grupo hemo)'],['H₂O₂ + 2 GSH → 2 H₂O + GSSG','Selenio'],['GSSG + NADPH → 2 GSH','FAD (vitamina B2)']],
        explain:'Ubicación: SOD Cu/Zn en citosol y SOD Mn en mitocondria; catalasa principalmente en peroxisomas; glutatión peroxidasa y reductasa en citosol y mitocondria. El NADPH proviene principalmente de la vía de las pentosas fosfato.'}},
      {n:4, text:'Expliquen cómo actúan la vitamina E, la vitamina C y los carotenoides: dónde actúan (medio acuoso o lipídico), qué alimentos los aportan y cómo la vitamina C «regenera» a la vitamina E.',
       widget:{type:'grid', rows:['Vitamina E (tocoferoles)','Vitamina C (ascorbato)','Carotenoides (β-caroteno, licopeno)'],
        cols:[{name:'Medio donde actúa', options:['Lipídico (membranas, lipoproteínas)','Acuoso (citosol, plasma)']}],
        answers:[['Lipídico (membranas, lipoproteínas)'],['Acuoso (citosol, plasma)'],['Lipídico (membranas, lipoproteínas)']],
        explain:'La vitamina E corta la propagación de la peroxidación lipídica y queda como radical tocoferoxilo; la vitamina C, en la interfase acuosa, la reduce y la regenera. Fuentes: E → aceites vegetales, frutos secos, semillas; C → cítricos, kiwi, pimentón; carotenoides → zanahoria, zapallo, tomate, hojas verdes.'}}
    ]},
    {title:'Parte C · Defensa con evidencia', qs:[
      {n:5, text:'Sofía tiene un requerimiento de vitamina C mayor que una persona no fumadora. Expliquen por qué y busquen cuánto mayor es según las recomendaciones de ingesta (citen la fuente).',
       hintKey:'Pregunta 5 · Vitamina C en fumadores',
       hints:['¿Qué contiene el humo del cigarrillo que «gasta» antioxidantes?','Concepto: más radicales → más vitamina C oxidada y un recambio más rápido.','Esquema: busquen en las ingestas dietéticas de referencia (IOM) el ajuste para fumadores → expliquen el mecanismo → aplíquenlo a Sofía.'],
       widget:{type:'numeric', prompt:'Según las ingestas dietéticas de referencia (IOM, 2000):', fields:[
         {label:'Aumento de vitamina C para fumadores (mg/día)', answer:35, tol:0},
         {label:'RDA de vitamina C para Sofía (mujer adulta fumadora, mg/día)', answer:110, tol:0}],
        explain:'IOM (2000): las personas fumadoras necesitan 35 mg/día adicionales. Mujer adulta: 75 + 35 = 110 mg/día (hombre: 90 + 35 = 125 mg/día). El humo aporta radicales que oxidan el ascorbato y aceleran su recambio.'}},
      {n:6, text:'Analicen el rumor de Entropía con al menos dos fuentes científicas. Consideren los resultados de los grandes ensayos con β-caroteno en fumadores y la evidencia sobre megadosis de vitaminas C y E y las adaptaciones al entrenamiento. Concluyan qué parte del rumor es falsa y por qué.',
       hintKey:'Pregunta 6 · El rumor de Entropía',
       hints:['¿Qué es un ensayo clínico aleatorizado y por qué pesa más que un estudio observacional?','Concepto: las especies reactivas también son señales; anularlas por completo puede bloquear adaptaciones al entrenamiento.','Esquema: separen el rumor en afirmaciones → busquen evidencia para cada una (ensayos ATBC y CARET, estudios en deportistas) → clasifiquen como verdadera, falsa o matizada → concluyan.'],
       widget:{type:'grid', prompt:'Clasifiquen cada afirmación del rumor.', rows:['«Los antioxidantes son siempre buenos»','«Mientras más suplementos antioxidantes tomes, más sano estarás y mejor rendirás»','«Si fumas, el β-caroteno en cápsulas te protege del cáncer»','«Una dieta rica en frutas y verduras aporta antioxidantes útiles»'],
        cols:[{name:'Veredicto', options:['Verdadera','Falsa','Matizada']}],
        answers:[['Matizada'],['Falsa'],['Falsa'],['Verdadera']],
        explain:'Las especies reactivas también son señales: un exceso de antioxidantes puede alterar el equilibrio. Megadosis de vitaminas C y E pueden atenuar adaptaciones al entrenamiento (p. ej., Gómez-Cabrera 2008; Ristow 2009). Los ensayos ATBC (1994) y CARET (1996) mostraron MÁS cáncer de pulmón en fumadores suplementados con β-caroteno.'}},
      {n:7, text:'Diseñen un menú de un día para Sofía o para Diego que aporte antioxidantes desde los alimentos. Indiquen, para cada tiempo de comida (desayuno, colación, almuerzo, once/merienda y cena), qué nutriente o compuesto antioxidante aporta y cuál es su función.'}
    ]}
  ],
  audit:{text:'«La superóxido dismutasa convierte el anión superóxido en peróxido de hidrógeno. La glutatión peroxidasa depende del hierro como cofactor para eliminar peróxidos. La vitamina E es hidrosoluble y actúa principalmente en el citosol. Por eso, a las personas fumadoras se les recomienda tomar suplementos de β-caroteno, ya que reducen el riesgo de cáncer de pulmón.»',
    items:[
      {s:'La superóxido dismutasa convierte el anión superóxido en peróxido de hidrógeno.', ok:true, fix:'Correcto.'},
      {s:'La glutatión peroxidasa depende del hierro como cofactor.', ok:false, fix:'Depende del selenio (selenocisteína en su sitio activo). La enzima con hierro (hemo) es la catalasa.'},
      {s:'La vitamina E es hidrosoluble y actúa principalmente en el citosol.', ok:false, fix:'Es liposoluble y actúa en las membranas y las lipoproteínas, cortando la peroxidación lipídica.'},
      {s:'A las personas fumadoras se les recomienda suplementar β-caroteno porque reduce el riesgo de cáncer de pulmón.', ok:false, fix:'Los ensayos ATBC y CARET mostraron que el β-caroteno en suplementos AUMENTÓ la incidencia de cáncer de pulmón en fumadores. No se recomienda.'}
    ]},
  errors:['Asociar la glutatión peroxidasa con el hierro.','Creer que la vitamina E es hidrosoluble.','Pensar que «más antioxidantes siempre es mejor».','Ignorar los ensayos con β-caroteno en fumadores.'],
  ticket:'Una membrana celular está expuesta al humo del cigarrillo. Explica cómo se inicia y se propaga la peroxidación lipídica, cómo la vitamina E la interrumpe y por qué la vitamina C es necesaria para que la vitamina E siga actuando.',
  expeditions:exps('Explica en 60 segundos por qué un poco de estrés oxidativo durante el ejercicio puede ser útil.','Dibuja en una página el «equipo de defensa» antioxidante: enzimas, minerales y vitaminas, y cómo se relacionan.','Verifica con dos fuentes la afirmación «el vino tinto es saludable por sus antioxidantes».'),
  riddle:{q:'Soy el mineral que necesita la glutatión peroxidasa para trabajar. (7 letras)', a:'SELENIO', opens:'reactor'},
  closing:'¡El Escudo está restaurado y los rumores de Entropía fueron desmentidos! Pero el Reactor ATP emite una alarma… La misión final se acerca y necesitarán todo lo que aprendieron.'
},

/* ---------------------------------------------------------- REACTOR */
{
  id:'reactor', code:'FINAL', type:'final', name:'El Reactor ATP', icon:'⚛️', color:'#ef5a35', badge:'maestria',
  weeks:'Semana 16', taller:'Actividad formativa', unit:'Interrelación metabólica',
  falla:'Entropía ataca el reactor central. Solo integrando todas las rutas podrán reactivarlo.',
  alert:'¡ALERTA MÁXIMA! Entropía ataca el Reactor ATP, el corazón energético de Metabolia.',
  briefing:'Reclutas, Entropía atacó el Reactor ATP, el corazón energético de Metabolia. El reactor no responde a una sola ruta: necesita que entiendan cómo conversan entre sí el hígado, el músculo, el tejido adiposo y el cerebro a lo largo de un día completo. Este es el momento para el que se entrenaron. Usen todo lo que aprendieron en los seis distritos.',
  objectives:['Integrar las rutas metabólicas en distintos estados fisiológicos y órganos.','Comunicar la integración mediante un producto visual y una explicación fundamentada.'],
  product:'Mapa metabólico integrado (infografía en Canva) + explicación breve (audio de 2 minutos o texto de 300 palabras).',
  elena:[
    {h:'07:30', m:'Desayuno', i:'🥣', d:'Avena con leche, un plátano y un huevo revuelto.', s:'fed'},
    {h:'08:00–13:00', m:'Clases', i:'📚', d:'Sentada, concentrada en clases y estudio.', s:'post'},
    {h:'13:30', m:'Almuerzo', i:'🍲', d:'Lentejas con arroz, ensalada con palta y una naranja.', s:'fed'},
    {h:'18:30–19:15', m:'Ejercicio', i:'🏃‍♀️', d:'Trote moderado de 45 minutos.', s:'ex'},
    {h:'20:30', m:'Cena', i:'🥪', d:'Sándwich de pan integral con pollo y tomate.', s:'fed'},
    {h:'23:00–07:30', m:'Ayuno nocturno', i:'🌙', d:'Duerme unas 8 horas; no come hasta el día siguiente.', s:'fast'}
  ],
  organs:['Hígado','Músculo','Tejido adiposo','Cerebro'],
  states:['Alimentado (tras el desayuno)','Ayuno nocturno (06:00)','Ejercicio (trote)'],
  routes:['Glucólisis','Glucogenogénesis','Glucogenólisis','Gluconeogénesis','β-oxidación','Cetogénesis','Lipogénesis','Síntesis de VLDL','Lipólisis','Captación de glucosa (GLUT4)','Almacenamiento de TG (LPL)','Síntesis proteica','Proteólisis','Uso de cuerpos cetónicos','Liberación de lactato','Ciclo de Cori'],
  hormones:['Insulina','Glucagón','Adrenalina','Cortisol'],
  ref:{
    'Hígado':[{core:['Glucogenogénesis','Glucólisis','Lipogénesis'],ok:['Síntesis de VLDL','Síntesis proteica']},{core:['Glucogenólisis','Gluconeogénesis','β-oxidación'],ok:['Cetogénesis','Ciclo de Cori']},{core:['Glucogenólisis','Gluconeogénesis'],ok:['Ciclo de Cori','β-oxidación']}],
    'Músculo':[{core:['Captación de glucosa (GLUT4)','Glucogenogénesis','Glucólisis'],ok:['Síntesis proteica']},{core:['β-oxidación'],ok:['Proteólisis','Uso de cuerpos cetónicos']},{core:['Glucogenólisis','Glucólisis','β-oxidación'],ok:['Captación de glucosa (GLUT4)','Liberación de lactato']}],
    'Tejido adiposo':[{core:['Captación de glucosa (GLUT4)','Almacenamiento de TG (LPL)'],ok:['Lipogénesis','Glucólisis']},{core:['Lipólisis'],ok:[]},{core:['Lipólisis'],ok:[]}],
    'Cerebro':[{core:['Glucólisis'],ok:[]},{core:['Glucólisis'],ok:[]},{core:['Glucólisis'],ok:[]}],
    'Hormona predominante':[{core:['Insulina'],ok:[]},{core:['Glucagón'],ok:['Cortisol']},{core:['Adrenalina'],ok:['Glucagón']}]
  },
  refNotes:'Notas de referencia: a las 06:00 (7 h de ayuno) el hígado mantiene la glucemia sobre todo con glucogenólisis, con aporte creciente de gluconeogénesis; los cuerpos cetónicos todavía son poco relevantes y el cerebro sigue usando glucosa. En el trote, el músculo usa al inicio glucógeno y glucosa, y a los 40 minutos aumenta la oxidación de ácidos grasos; la adrenalina activa glucogenólisis y lipólisis, y la insulina baja.',
  questions:[
    {n:1, text:'Tras el desayuno: sigan una molécula de glucosa de la avena desde el intestino hasta su destino en el hígado y en el músculo. ¿Qué hormona da las órdenes y qué enzimas o transportadores participan?'},
    {n:2, text:'A las 06:00, tras 7 horas de ayuno: ¿cómo mantiene Elena su glucemia? ¿Qué aporta el tejido adiposo y qué combustible usa su cerebro? ¿Son relevantes los cuerpos cetónicos a esta hora? Justifiquen.'},
    {n:3, text:'Durante el trote: ¿qué combustibles usa el músculo al inicio y a los 40 minutos? Expliquen el papel de la adrenalina y del ciclo de Cori.'},
    {n:4, text:'En el almuerzo: ¿qué ocurre con las proteínas de las lentejas y su nitrógeno (misión 3)? ¿Cómo viajan las grasas de la palta y qué lipoproteínas participan (misión 5)?'},
    {n:5, text:'El ejercicio genera especies reactivas. ¿Qué defensas antioxidantes tiene Elena y qué alimentos de su día las apoyan (misión 6)? ¿Qué enzimas de su día necesitan coenzimas derivadas de vitaminas (misión 1)?'},
    {n:6, text:'Predicción: ¿qué cambiaría en el cuadro si Elena se saltara el desayuno y trotara a las 08:00 en ayunas? Expliquen al menos tres cambios.'}
  ],
  productSteps:['Usen la plantilla de infografía de Canva: 4 órganos × 3 estados, con el Reactor ATP al centro.','Incluyan: rutas activas, hormona por estado, flechas de intercambio entre órganos (glucosa, lactato, alanina, ácidos grasos, cuerpos cetónicos, lipoproteínas) y una leyenda.','Graben un audio de 2 minutos o escriban 300 palabras que expliquen «el día de Elena» como una historia metabólica.','Completen la declaración de uso de IA. Si usan funciones de IA de Canva, declárenlo.'],
  reflection:['¿Qué ruta entendí de verdad solo cuando la conecté con otras?','Si tuviera que explicarle a un paciente por qué no conviene saltarse comidas antes de entrenar, ¿qué le diría?','¿Cómo cambió mi forma de usar la IA durante el semestre?'],
  closing:'El Reactor ATP vuelve a girar y Metabolia se ilumina por completo. Reclutas: ya no son reclutas. Son detectives del metabolismo. Gracias por no dejar de pensar, ni siquiera cuando Entropía les ofrecía el camino fácil.'
},

/* ---------------------------------------------------------- RESCATE */
{
  id:'rescate', code:'R', type:'rescue', name:'Misión de Rescate', icon:'🛟', color:'#8b5cf6',
  weeks:'Semana 17', taller:'Taller recuperativo', unit:'Ruta de refuerzo personalizada',
  falla:'Quedan distritos sin restaurar. Una segunda oportunidad para restaurar los distritos pendientes.',
  briefing:'Reclutas, algunos distritos aún parpadean. Eso no es un fracaso: es información. En el Instituto, cada error bien analizado vale tanto como un acierto. Esta es su segunda oportunidad: elijan los distritos pendientes y restáurenlos.',
  how:['Revisen el Informe del Instituto y las insignias disciplinares que faltan.','Resuelvan solo los retos de rescate de esas misiones. Pueden usar pistas y a la Dra. Mito, según el Pacto.','Cada reto superado con nivel «Competente» o superior desbloquea la insignia pendiente de ese distrito.','La nota del taller recuperativo se rige por la normativa del curso; este juego solo organiza el refuerzo.'],
  challenges:[
    {m:'m1', badge:'catalizador', caso:'Una enzima tiene Vmax = 100 µmol/min y Km = 2 mM. Con un inhibidor, la Vmax baja a 50 µmol/min y la Km se mantiene en 2 mM.',
     qs:['¿Qué tipo de inhibición es? Justifiquen con lo que ocurriría en un gráfico de Lineweaver-Burk.','¿Se revierte aumentando la concentración de sustrato? ¿Por qué?','Den un ejemplo de coenzima derivada de una vitamina y la reacción en que participa.'],
     widget:{type:'choice', prompt:'El inhibidor es…', options:['Competitivo','No competitivo','Acompetitivo'], correct:[1], explain:'Vmax ↓ con Km igual: inhibición no competitiva. En Lineweaver-Burk las rectas se cortan en el eje X (−1/Km igual) y aumenta el intercepto en Y. No se revierte con más sustrato, porque el inhibidor no compite por el sitio activo.'}},
    {m:'m2', badge:'energia', caso:'Martina no ha comido en 18 horas y su glucemia es de 80 mg/dL.',
     qs:['¿De dónde proviene la glucosa que circula en su sangre en este momento? Nombren las dos rutas hepáticas y sus sustratos.','¿Qué hormona predomina y qué efecto tiene sobre el glucógeno hepático?','¿Por qué su glucógeno muscular no ayuda a mantener la glucemia?'],
     widget:{type:'choice', multi:true, prompt:'Rutas hepáticas que aportan glucosa a las 18 h de ayuno (seleccione dos):', options:['Glucogenólisis','Gluconeogénesis','Glucólisis','Lipogénesis','β-oxidación'], correct:[0,1], explain:'Glucogenólisis (glucógeno hepático, ya en descenso) y gluconeogénesis (lactato, alanina, glicerol). Predomina el glucagón, que activa la glucógeno fosforilasa. El músculo carece de glucosa-6-fosfatasa.'}},
    {m:'m3', badge:'ciclo', caso:'Pablo pesa 70 kg, ingiere 84 g de proteína al día y elimina 12 g de NUU en 24 h.',
     qs:['Calculen su balance nitrogenado (muestren el desarrollo) e interpreten el resultado.','¿En qué órgano se forma la urea y de dónde provienen sus dos nitrógenos?','¿Qué recomendaciones daría según su ingesta en g/kg/día?'],
     widget:{type:'numeric', prompt:'Balance de Pablo:', fields:[{label:'N ingerido (g/día)', answer:13.44, tol:0.05},{label:'N eliminado (g/día)', answer:16, tol:0.05},{label:'Balance (g/día)', answer:-2.56, tol:0.06},{label:'Ingesta (g/kg/día)', answer:1.2, tol:0.03}], explain:'84 ÷ 6,25 = 13,44; 12 + 4 = 16; balance = −2,56 g/día (negativo). Ingesta = 84 ÷ 70 = 1,2 g/kg/día. La urea se forma en el hígado; sus nitrógenos provienen del NH₄⁺ (carbamoil fosfato) y del aspartato.'}},
    {m:'m4', badge:'reserva', caso:'Una persona realiza un ayuno de 48 horas.',
     qs:['Calculen el ATP neto de la oxidación completa del ácido mirístico (14 C), mostrando el desarrollo (2,5 por NADH, 1,5 por FADH₂, 10 por acetil-CoA).','Expliquen por qué los ácidos grasos no pueden convertirse en glucosa, pero el glicerol sí.','¿Por qué el hígado produce cuerpos cetónicos y no los usa?'],
     widget:{type:'numeric', prompt:'Ácido mirístico (14 C):', fields:[{label:'Vueltas de β-oxidación', answer:6, tol:0},{label:'Acetil-CoA', answer:7, tol:0},{label:'ATP neto', answer:92, tol:0}], explain:'6 FADH₂ × 1,5 = 9; 6 NADH × 2,5 = 15; 7 acetil-CoA × 10 = 70 → 94 − 2 (activación) = 92 ATP.'}},
    {m:'m5', badge:'logistica', caso:'Perfil en ayunas de Ignacio: colesterol total 240 mg/dL, HDL 45 mg/dL, triglicéridos 200 mg/dL.',
     qs:['Calculen el LDL (Friedewald) y el colesterol no-HDL. Muestren el desarrollo.','Expliquen el transporte reverso del colesterol y qué lipoproteína lo realiza.','Propongan dos recomendaciones alimentarias y expliquen el mecanismo de cada una.'],
     widget:{type:'numeric', prompt:'Perfil de Ignacio (mg/dL):', fields:[{label:'LDL (Friedewald)', answer:155, tol:0},{label:'Colesterol no-HDL', answer:195, tol:0}], explain:'LDL = 240 − 45 − (200 ÷ 5) = 240 − 45 − 40 = 155 mg/dL. No-HDL = 240 − 45 = 195 mg/dL. El transporte reverso lo realiza la HDL.'}},
    {m:'m6', badge:'antioxidante', caso:'Un anuncio afirma: «Tomar 2 g de vitamina C al día previene el estrés oxidativo en todas las personas».',
     qs:['Analicen la afirmación con el concepto de estrés oxidativo como desequilibrio y con al menos una fuente.','¿Qué enzima antioxidante necesita selenio y qué reacción cataliza?','¿Dónde actúa la vitamina E y cómo se relaciona con la vitamina C?'],
     widget:{type:'choice', prompt:'La enzima que necesita selenio es…', options:['Catalasa','Superóxido dismutasa','Glutatión peroxidasa','Glutatión reductasa'], correct:[2], explain:'Glutatión peroxidasa: H₂O₂ + 2 GSH → 2 H₂O + GSSG. La vitamina E actúa en las membranas (medio lipídico) y la vitamina C la regenera.'}}
  ],
  bitacora:['¿Cuál era mi error en esta misión y cómo lo corregí?','¿Qué haré distinto la próxima vez que estudie un tema nuevo?'],
  closing:'Los distritos que restauraron hoy brillan igual que los demás. En Metabolia nadie se queda atrás.'
}
];

/* Posiciones en el mapa (viewBox 1600 × 900) */
const MAP_POS = {
  m0:[150,770], m1:[330,555], m2:[420,250], m3:[730,135], m4:[1060,165],
  camp:[1310,330], m5:[1220,610], m6:[960,770], reactor:[790,455], rescate:[1480,680]
};
const MAP_PATH = ['m0','m1','m2','m3','m4','camp','m5','m6','reactor'];

/* Presets de cronómetro */
const TIMER_PRESETS = [
  {l:'Briefing', m:10},{l:'Exploración guiada', m:20},{l:'Operación en equipo', m:60},{l:'Auditoría IA', m:15},
  {l:'Debriefing', m:20},{l:'Reto individual', m:15},{l:'Bitácora', m:10},{l:'Escape room', m:45},{l:'Mercado de ATP', m:10},{l:'Reparación de misiones', m:30}
];
