const {
  useState,
  useEffect
} = React;
const B = "#3C3489",
  BL = "#534AB7",
  BB = "#EEEDFE",
  PIT = "#0D1A0D";
const TICKER = ["🔴 T09 · Jordan LaRose injury 6 weeks · Maccabi TLV seeking replacement", "🟡 T02 · Dian Civita — contract expires 22 days · Maccabi Haifa", "🚨 T28 · Marius Houri submitted formal transfer request · Beitar Jerusalem", "📈 T14 · Goncalo Figueiredo 14 assists · EU midfielder 41 days", "📉 T20 · Hapoel KS relegated · 5 players with exit clauses", "🔓 T24 · Summer window opens 1.7.26 · 14 days"];
const OWN = [{
  id: 1,
  n: "Jordan LaRose",
  i2: "J.L",
  pos: "FWD",
  tm: "Maccabi TLV",
  age: 28,
  days: 18,
  sal: 14.0,
  val: 1200,
  st: "injury",
  pp: "FR/EU",
  g: 9,
  a: 4,
  rat: 7.6,
  sc: 91,
  bg: "#FCEBEB",
  tc: "#A32D2D"
}, {
  id: 2,
  n: "Dian Civita",
  i2: "D.C",
  pos: "MID",
  tm: "Maccabi Haifa",
  age: 27,
  days: 22,
  sal: 11.5,
  val: 950,
  st: "expiring",
  pp: "BE/EU",
  g: 5,
  a: 11,
  rat: 7.9,
  sc: 88,
  bg: BB,
  tc: B
}, {
  id: 3,
  n: "Nadav Ben Haim",
  i2: "N.B",
  pos: "FWD",
  tm: "Hapoel BS",
  age: 26,
  days: 16,
  sal: 9.5,
  val: 780,
  st: "expiring",
  pp: "IL",
  g: 14,
  a: 3,
  rat: 8.0,
  sc: 86,
  bg: "#E1F5EE",
  tc: "#085041"
}, {
  id: 4,
  n: "Marius Houri",
  i2: "M.H",
  pos: "CB",
  tm: "Beitar Jerusalem",
  age: 30,
  days: 198,
  sal: 12.0,
  val: 600,
  st: "transfer_req",
  pp: "RO/EU",
  g: 1,
  a: 3,
  rat: 7.4,
  sc: 89,
  bg: "#FAECE7",
  tc: "#712B13"
}, {
  id: 5,
  n: "Goncalo Figueiredo",
  i2: "G.F",
  pos: "MID",
  tm: "Hapoel TLV",
  age: 25,
  days: 41,
  sal: 10.0,
  val: 820,
  st: "expiring",
  pp: "PT/EU",
  g: 6,
  a: 14,
  rat: 8.2,
  sc: 90,
  bg: "#FAEEDA",
  tc: "#633806"
}, {
  id: 6,
  n: "Amit Shahar",
  i2: "A.S",
  pos: "DEF",
  tm: "Free Agent",
  age: 24,
  days: 0,
  sal: 6.5,
  val: 320,
  st: "free",
  pp: "IL",
  g: 0,
  a: 2,
  rat: 6.9,
  sc: 79,
  bg: BB,
  tc: B
}, {
  id: 7,
  n: "Amad Boukar",
  i2: "A.B",
  pos: "MID",
  tm: "Maccabi PT",
  age: 26,
  days: 167,
  sal: 8.5,
  val: 580,
  st: "active",
  pp: "FR/EU",
  g: 3,
  a: 8,
  rat: 7.7,
  sc: 84,
  bg: "#E1F5EE",
  tc: "#085041"
}, {
  id: 8,
  n: "Yarden Shalom",
  i2: "Y.S",
  pos: "CB",
  tm: "Hapoel Haifa",
  age: 29,
  days: 74,
  sal: 7.8,
  val: 420,
  st: "active",
  pp: "IL",
  g: 2,
  a: 1,
  rat: 7.2,
  sc: 77,
  bg: BB,
  tc: B
}];
const MKT = [{
  id: 11,
  n: "Boris Matabu",
  i2: "B.M",
  pos: "FWD",
  tm: "Ironi TLV",
  days: 25,
  sal: 7.2,
  val: 480,
  st: "expiring",
  pp: "FR/EU",
  sc: 88,
  bg: "#E1F5EE",
  tc: "#085041",
  src: "Transfer365 AI"
}, {
  id: 12,
  n: "Nicolas Fransici",
  i2: "N.F",
  pos: "MID",
  tm: "Free Agent",
  days: 0,
  sal: 8.0,
  val: 390,
  st: "free",
  pp: "AR/EU",
  sc: 85,
  bg: "#FAEEDA",
  tc: "#633806",
  src: "Transfer365 AI"
}, {
  id: 13,
  n: "Yaniv Knaan",
  i2: "Y.K",
  pos: "CB",
  tm: "MNS FC",
  days: 14,
  sal: 6.5,
  val: 310,
  st: "expiring",
  pp: "IL",
  sc: 76,
  bg: BB,
  tc: B,
  src: "Transfer365 AI"
}, {
  id: 14,
  n: "Kosta Nikolic",
  i2: "K.N",
  pos: "DEF",
  tm: "Free Agent",
  days: 0,
  sal: 7.0,
  val: 280,
  st: "free",
  pp: "RS/EU",
  sc: 80,
  bg: "#E1F5EE",
  tc: "#085041",
  src: "Transfer365 AI"
}];
const MATCHES = [{
  pid: 1,
  p: "Jordan LaRose",
  pos: "CB",
  tm: "Beitar Jerusalem",
  sc: 91,
  urg: "high",
  why: "Team injury + Beitar seeking EU CB",
  pros: ["High demand position", "Passport EU"],
  cons: ["Salary €5.5K"],
  fee: 200,
  bg: "#FCEBEB",
  tc: "#A32D2D",
  src: "Transfer365 AI"
}, {
  pid: 5,
  p: "Goncalo Figueiredo",
  pos: "MID",
  tm: "Maccabi TLV",
  sc: 88,
  urg: "high",
  why: "EU midfielder + Maccabi TLV with free budget",
  pros: ["EU", "12 Assists"],
  cons: ["Salary €7.5K"],
  fee: 350,
  bg: "#FAEEDA",
  tc: "#633806",
  src: "Transfer365 AI"
}, {
  pid: 4,
  p: "Marius Houri",
  pos: "FWD",
  tm: "Maccabi Haifa",
  sc: 88,
  urg: "high",
  why: "submitted formal transfer request",
  pros: ["EU", "18 Goals"],
  cons: ["Salary €9K"],
  fee: 500,
  bg: "#FAECE7",
  tc: "#712B13",
  src: "Transfer365 AI"
}, {
  pid: 3,
  p: "Nadav Ben Haim",
  pos: "FWD",
  tm: "MPS FC",
  sc: 84,
  urg: "high",
  why: "contract expiring 19 days",
  pros: ["Israeli", "8.1 Rating"],
  cons: ["6 competitors"],
  fee: 250,
  bg: "#E1F5EE",
  tc: "#085041",
  src: "Transfer365 AI"
}, {
  pid: 2,
  p: "Dian Civita",
  pos: "CB",
  tm: "Hapoel TLV",
  sc: 81,
  urg: "medium",
  why: "23 days to contract, Hapoel TLV without CB",
  pros: ["EU", "Experience"],
  cons: ["Competition"],
  fee: 180,
  bg: BB,
  tc: B,
  src: "Transfer365 AI"
}];
const DEALS0 = [{
  id: 1,
  p: "Jordan LaRose",
  fr: "Maccabi TLV",
  to: "Beitar",
  fee: 200,
  st: 1,
  din: 5,
  comm: 14000,
  bg: "#FCEBEB",
  tc: "#A32D2D"
}, {
  id: 2,
  p: "Goncalo Figueiredo",
  fr: "MPS FC",
  to: "Maccabi TLV",
  fee: 350,
  st: 1,
  din: 3,
  comm: 24500,
  bg: "#FAEEDA",
  tc: "#633806"
}, {
  id: 3,
  p: "Nadav Ben Haim",
  fr: "Hapoel TLV",
  to: "MPS FC",
  fee: 250,
  st: 2,
  din: 8,
  comm: 17500,
  bg: "#E1F5EE",
  tc: "#085041"
}, {
  id: 4,
  p: "Marius Houri",
  fr: "Beitar",
  to: "Maccabi Haifa",
  fee: 500,
  st: 2,
  din: 12,
  comm: 35000,
  bg: "#FAECE7",
  tc: "#712B13"
}, {
  id: 5,
  p: "Amit Shahar",
  fr: "Market",
  to: "Hapoel BS",
  fee: 60,
  st: 3,
  din: 1,
  comm: 4200,
  bg: BB,
  tc: B
}, {
  id: 6,
  p: "Fransici",
  fr: "Market",
  to: "Ironi KS",
  fee: 80,
  st: 4,
  din: 0,
  comm: 5600,
  bg: "#FAEEDA",
  tc: "#633806"
}];
const BUDG = [{
  t: "Maccabi TLV",
  b: 2400,
  u: 1800
}, {
  t: "Beitar",
  b: 1800,
  u: 1200
}, {
  t: "Hapoel TLV",
  b: 1600,
  u: 1400
}, {
  t: "Maccabi Haifa",
  b: 1500,
  u: 900
}, {
  t: "Hapoel BS",
  b: 1200,
  u: 800
}, {
  t: "MPS FC",
  b: 900,
  u: 700
}, {
  t: "Bnei Yehuda",
  b: 800,
  u: 650
}, {
  t: "Maccabi Netanya",
  b: 700,
  u: 400
}];
const ALTS0 = [{
  id: 1,
  ic: "ti-first-aid-kit",
  bg: "#FCEBEB",
  tc: "#A32D2D",
  tx: "Jordan LaRose injured — 6 weeks. 3 clubs inquired.",
  tm: "08:02",
  r: false,
  tg: "T09"
}, {
  id: 2,
  ic: "ti-clock",
  bg: "#FAEEDA",
  tc: "#633806",
  tx: "Dian Civita — contract ends in 22 days.",
  tm: "08:02",
  r: false,
  tg: "T02"
}, {
  id: 3,
  ic: "ti-arrows-exchange",
  bg: BB,
  tc: B,
  tx: "Marius Houri submitted formal transfer request from Beitar.",
  tm: "07:45",
  r: false,
  tg: "T28"
}, {
  id: 4,
  ic: "ti-trending-up",
  bg: "#E1F5EE",
  tc: "#085041",
  tx: "Nadav Ben Haim — 5 goals in 4 games.",
  tm: "07:30",
  r: true,
  tg: "T14"
}, {
  id: 5,
  ic: "ti-rectangle",
  bg: "#FAECE7",
  tc: "#712B13",
  tx: "Yarden Shalom — red card. Out 3 games.",
  tm: "22:10",
  r: true,
  tg: "T16"
}, {
  id: 6,
  ic: "ti-user-check",
  bg: "#EAF3DE",
  tc: "#27500A",
  tx: "Amit Shahar became a free agent.",
  tm: "Yesterday",
  r: true,
  tg: "T03"
}];
const TCAT = [{
  lb: "Contracts",
  its: [{
    id: "T02",
    n: "Contract ending — 30 days",
    ic: "ti-clock",
    w: 3,
    on: true
  }, {
    id: "T03",
    n: "Player became free",
    ic: "ti-user-check",
    w: 1,
    on: true
  }, {
    id: "T05",
    n: "Exit clause — % minutes",
    ic: "ti-percentage",
    w: 2,
    on: true
  }, {
    id: "T04",
    n: "Clause — relegation",
    ic: "ti-chevrons-down",
    w: 1,
    on: true
  }, {
    id: "T01",
    n: "Contract — 90 days",
    ic: "ti-calendar-time",
    w: 1,
    on: false
  }]
}, {
  lb: "Injuries",
  its: [{
    id: "T09",
    n: "Long injury (4+ weeks)",
    ic: "ti-first-aid-kit",
    w: 4,
    on: true
  }, {
    id: "T08",
    n: "Short injury",
    ic: "ti-bandage",
    w: 2,
    on: false
  }, {
    id: "T10",
    n: "Return from injury",
    ic: "ti-run",
    w: 1,
    on: true
  }, {
    id: "T11",
    n: "Recurring injury",
    ic: "ti-alert-triangle",
    w: 1,
    on: true
  }]
}, {
  lb: "Performance",
  its: [{
    id: "T14",
    n: "Hot player",
    ic: "ti-flame",
    w: 1,
    on: true
  }, {
    id: "T12",
    n: "Not getting minutes",
    ic: "ti-player-pause",
    w: 1,
    on: true
  }, {
    id: "T30",
    n: "Value change +20%",
    ic: "ti-chart-line",
    w: 1,
    on: true
  }, {
    id: "T13",
    n: "Decline",
    ic: "ti-trending-down",
    w: 1,
    on: false
  }]
}, {
  lb: "Club",
  its: [{
    id: "T16",
    n: "Red card",
    ic: "ti-rectangle",
    w: 1,
    on: true
  }, {
    id: "T20",
    n: "Team relegated",
    ic: "ti-trending-down",
    w: 2,
    on: true
  }, {
    id: "T22",
    n: "Coach sacked",
    ic: "ti-user-minus",
    w: 1,
    on: true
  }, {
    id: "T25",
    n: "72hrs to window",
    ic: "ti-alarm",
    w: 3,
    on: true
  }, {
    id: "T28",
    n: "Transfer request",
    ic: "ti-arrows-exchange",
    w: 1,
    on: true
  }]
}];
const TREND = [{
  m: "Jan",
  v: 185
}, {
  m: "Feb",
  v: 192
}, {
  m: "Mar",
  v: 198
}, {
  m: "Apr",
  v: 210
}, {
  m: "May",
  v: 225
}, {
  m: "Jun",
  v: 242
}];
const COMM_H = [{
  m: "Jan",
  c: 3200
}, {
  m: "Feb",
  c: 0
}, {
  m: "Mar",
  c: 8500
}, {
  m: "Apr",
  c: 12000
}, {
  m: "May",
  c: 7500
}, {
  m: "Jun",
  c: 16700
}];
const NAV = [{
  id: "dash",
  ic: "ti-layout-dashboard",
  l: "Dashboard"
}, {
  id: "port",
  ic: "ti-briefcase",
  l: "Portfolio"
}, {
  id: "disc",
  ic: "ti-search",
  l: "Discover"
}, {
  id: "mch",
  ic: "ti-target",
  l: "AI Matches"
}, {
  id: "pipe",
  ic: "ti-timeline",
  l: "Deals CRM"
}, {
  id: "budg",
  ic: "ti-coins",
  l: "Budgets"
}, {
  id: "cal",
  ic: "ti-calendar",
  l: "Calendar"
}, {
  id: "anl",
  ic: "ti-chart-bar",
  l: "Analytics"
}, {
  id: "net",
  ic: "ti-network",
  l: "Network"
}, {
  id: "set",
  ic: "ti-bell",
  l: "Alerts"
}];
const STAGES = ["Discovery", "Contact", "Negotiation", "Signing", "Close"];
const SBG = ["#F1EFE8", BB, "#FAEEDA", "#E6F1FB", "#EAF3DE"];
const STC = ["#5F5E5A", B, "#633806", "#0C447C", "#27500A"];
const dC = d => d === 0 ? {
  bg: "#EAF3DE",
  tc: "#27500A",
  l: "Free"
} : d <= 30 ? {
  bg: "#FCEBEB",
  tc: "#A32D2D",
  l: d + "d"
} : d <= 90 ? {
  bg: "#FAEEDA",
  tc: "#633806",
  l: d + "d"
} : {
  bg: "#F1EFE8",
  tc: "#5F5E5A",
  l: d + "d"
};
const sC = s => s >= 85 ? "#1D9E75" : s >= 70 ? "#EF9F27" : "#E24B4A";
const stL = s => ({
  injury: {
    l: "Injury",
    bg: "#FCEBEB",
    tc: "#A32D2D"
  },
  expiring: {
    l: "Expiring",
    bg: "#FAEEDA",
    tc: "#633806"
  },
  free: {
    l: "Free",
    bg: "#EAF3DE",
    tc: "#27500A"
  },
  suspended: {
    l: "Suspended",
    bg: "#FAECE7",
    tc: "#712B13"
  },
  transfer_req: {
    l: "Transfer request",
    bg: BB,
    tc: B
  },
  active: {
    l: "Active",
    bg: "#F1EFE8",
    tc: "#5F5E5A"
  }
})[s] || {
  l: "Active",
  bg: "#F1EFE8",
  tc: "#5F5E5A"
};
const fmt = n => "€" + Number(n).toLocaleString();
const pad = n => String(n).padStart(2, "0");
const Pill = ({
  l,
  bg,
  tc,
  s = {}
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 8,
    background: bg,
    color: tc,
    ...s
  }
}, l);
const Card = ({
  children,
  style = {}
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    background: "var(--bg1)",
    border: "0.5px solid var(--bd3)",
    borderRadius: 12,
    ...style
  }
}, children);
const CardH = ({
  title,
  action,
  onAction
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: "10px 14px",
    borderBottom: "0.5px solid var(--bd3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--tx1)"
  }
}, title), action && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11,
    color: B,
    cursor: "pointer"
  },
  onClick: onAction
}, action));
const Stat = ({
  l,
  v,
  s,
  bg,
  c
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    background: bg || "var(--bg2)",
    borderRadius: 10,
    padding: "12px 14px"
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    color: "var(--tx3)",
    marginBottom: 4
  }
}, l), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 22,
    fontWeight: 600,
    color: c || "var(--tx1)",
    fontVariantNumeric: "tabular-nums"
  }
}, v), s && /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    color: "var(--tx3)",
    marginTop: 2
  }
}, s));
function App() {
  
  // ── Plan & feature gating ──────────────────────────────────────────
  const _plan = (window._T365 && window._T365.plan) || 'scout';
  const PLAN_RANK = { scout: 0, agent: 1, director: 2, executive: 3 };
  const canUse = (minPlan) => (PLAN_RANK[_plan] || 0) >= (PLAN_RANK[minPlan] || 0);

  function UpgradeWall({ minPlan, feature }) {
    if (canUse(minPlan)) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute", inset: 0, background: "rgba(15,17,23,.85)",
        backdropFilter: "blur(4px)", borderRadius: 12,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", zIndex: 10,
        padding: 24, textAlign: "center"
      }
    },
      React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, "🔒"),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 } },
        feature + " — " + minPlan.charAt(0).toUpperCase() + minPlan.slice(1) + "+ plan"),
      React.createElement("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 14 } },
        "Upgrade to unlock this feature"),
      React.createElement("a", {
        href: "/#pricing",
        style: { padding: "8px 18px", borderRadius: 8, background: "#3C3489",
          color: "#EEEDFE", fontSize: 12, fontWeight: 700, textDecoration: "none" }
      }, "Upgrade now →")
    );
  }

const [pg, setPg] = useState("dash");
  const [ti, setTi] = useState(0);
  const [secs, setSecs] = useState(41 * 86400 + 7 * 3600 + 23 * 60);
  const [wtch, setWtch] = useState(() => {
    const w = {};
    OWN.forEach(p => w[p.id] = Math.floor(Math.random() * 5) + 1);
    MATCHES.forEach((_, i) => w["m" + i] = Math.floor(Math.random() * 6) + 1);
    MKT.forEach(p => w["mk" + p.id] = Math.floor(Math.random() * 8) + 1);
    for (let i = 0; i < 6; i++) w["n" + i] = Math.floor(Math.random() * 30) + 5;
    return w;
  });
  const [pls, setPls] = useState(null);
  const [alts, setAlts] = useState(ALTS0);
  const [trigs, setTrigs] = useState(TCAT);
  const [deals, setDeals] = useState(DEALS0);
  const [ownPl, setOwnPl] = useState(OWN);
  const [mktPl, setMktPl] = useState(MKT);
  const [saved, setSaved] = useState(new Set());
  const [swI, setSwI] = useState(0);
  const [swDir, setSwDir] = useState(null);
  const [pF, setPF] = useState("all");
  const [srch, setSrch] = useState("");
  const [mF, setMF] = useState("all");
  const [modal, setModal] = useState(null);
  const [calcO, setCalcO] = useState(null);
  const [commP, setCommP] = useState(5);
  const [mktS, setMktS] = useState("");
  const [channels, setChannels] = useState({
    email:    { on: true,  val: (window._T365 && window._T365.email) || '' },
    whatsapp: { on: false, val: '' },
    telegram: { on: false, val: '' },
    push:     { on: false, val: '' },
  });
  const [savedCh, setSavedCh] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTi(i => (i + 1) % TICKER.length), 4000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      setWtch(w => {
        const ks = Object.keys(w);
        const k = ks[Math.floor(Math.random() * ks.length)];
        const nw = {
          ...w,
          [k]: Math.max(1, Math.min(12, w[k] + (Math.random() > .45 ? 1 : -1)))
        };
        setPls(k);
        setTimeout(() => setPls(null), 700);
        return nw;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);
  const wD = Math.floor(secs / 86400),
    wH = Math.floor(secs % 86400 / 3600),
    wM = Math.floor(secs % 3600 / 60),
    wS = secs % 60;
  const unread = alts.filter(a => !a.r).length;
  const wkly = trigs.reduce((s, c) => s + c.its.reduce((ss, t) => ss + (t.on ? t.w : 0), 0), 0);
  const totC = deals.reduce((s, d) => s + d.comm, 0);
  function W({
    id,
    lg = false
  }) {
    const n = wtch[id] || 1,
      hot = n >= 4,
      ip = pls === String(id);
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: lg ? 11 : 10,
        color: hot ? "#A32D2D" : "var(--tx3)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: lg ? 8 : 6,
        height: lg ? 8 : 6,
        borderRadius: "50%",
        background: hot ? "#E24B4A" : "var(--bd2)",
        flexShrink: 0,
        transition: "transform .3s",
        transform: ip ? "scale(2.4)" : "scale(1)",
        animation: ip ? "pulse .5s ease" : ""
      }
    }), n, " ", n === 1 ? "agent" : "agents", " online");
  }
  function PlayerModal() {
    if (!modal) return null;
    const p = modal,
      sl = stL(p.st),
      dc = dC(p.days);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      onClick: () => setModal(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg1)",
        borderRadius: 16,
        padding: 20,
        width: 400,
        maxHeight: "88vh",
        overflow: "auto"
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: p.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 700,
        color: p.tc,
        flexShrink: 0
      }
    }, p.i2), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, p.n), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--tx3)",
        marginTop: 2
      }
    }, p.pos, " · ", p.tm, " · Age ", p.age)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 700,
        color: sC(p.sc),
        fontVariantNumeric: "tabular-nums"
      }
    }, p.sc), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "var(--tx3)"
      }
    }, "AI Score")), /*#__PURE__*/React.createElement("button", {
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "none",
        background: "var(--bg2)",
        cursor: "pointer",
        fontSize: 14,
        color: "var(--tx2)"
      },
      onClick: () => setModal(null)
    }, "✕")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 8,
        marginBottom: 14
      }
    }, [{
      l: "Market Value",
      v: fmt(p.val) + "K"
    }, {
      l: "Monthly Salary",
      v: fmt(p.sal) + "K"
    }, {
      l: "Contract",
      v: dC(p.days).l,
      bg: dC(p.days).bg,
      c: dC(p.days).tc
    }].map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: s.bg || "var(--bg2)",
        borderRadius: 8,
        padding: "8px 10px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "var(--tx3)",
        marginBottom: 2
      }
    }, s.l), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: s.c || "var(--tx1)",
        fontVariantNumeric: "tabular-nums"
      }
    }, s.v)))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg2)",
        borderRadius: 10,
        padding: "12px",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--tx2)",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: ".06em"
      }
    }, "Season Stats"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 8
      }
    }, [{
      l: "Goals",
      v: p.g
    }, {
      l: "Assists",
      v: p.a
    }, {
      l: "Rating",
      v: p.rat
    }, {
      l: "Passport",
      v: p.pp
    }].map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "var(--tx3)"
      }
    }, s.l), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, s.v))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 14,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      l: sl.l,
      bg: sl.bg,
      tc: sl.tc
    }), p.pp.includes("EU") && /*#__PURE__*/React.createElement(Pill, {
      l: "EU Passport",
      bg: "#EAF3DE",
      tc: "#27500A"
    }), /*#__PURE__*/React.createElement(W, {
      id: p.id,
      lg: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        flex: 1,
        padding: "10px",
        borderRadius: 9,
        border: "none",
        background: B,
        color: "#EEEDFE",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700
      }
    }, "Contact Now"), /*#__PURE__*/React.createElement("button", {
      style: {
        padding: "10px 16px",
        borderRadius: 9,
        border: "0.5px solid " + B,
        background: "transparent",
        color: B,
        cursor: "pointer",
        fontSize: 13
      },
      onClick: () => setModal(null)
    }, "Close"))));
  }
  function Dash() {
    const urg = ownPl.filter(p => p.days <= 30 || p.st === "injury" || p.st === "free").length;
    const nm = MATCHES.filter(m => m.urg === "high").length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "linear-gradient(135deg," + PIT + ",#152A15)",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "rgba(34,197,94,.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-sparkles",
      style: {
        fontSize: 20,
        color: "#22C55E"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(255,255,255,.4)",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: ".06em"
      }
    }, "Morning Brief · AI"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "rgba(255,255,255,.82)",
        lineHeight: 1.6
      }
    }, "You have ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#FCD34D",
        fontWeight: 700
      }
    }, urg, " urgent players"), " — ", ownPl.filter(p => p.st === "injury").length, " injuries and ", ownPl.filter(p => p.days <= 30 && p.st !== "free").length, " expiring contracts. ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#86EFAC"
      }
    }, "Transfer window in ", wD, " days.")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 10
      }
    }, /*#__PURE__*/
      /*#__PURE__*/React.createElement("div", {
        style: { background: "#1e293b", borderRadius: 10, padding: "12px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between" }
      },
        React.createElement("div", { style: { fontSize: 10, color: "var(--tx3)" } }, "Your Plan"),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("span", {
            style: { fontSize: 12, fontWeight: 700, color: "#a78bfa",
              background: "#2d1b69", padding: "3px 10px", borderRadius: 20 }
          }, (_plan.charAt(0).toUpperCase() + _plan.slice(1))),
          _plan === "scout" && React.createElement("a", {
            href: "/#pricing",
            style: { fontSize: 11, color: "#3b82f6", textDecoration: "none" }
          }, "Upgrade →")
        )
      ),
      React.createElement(Stat, {
      l: "Players",
      v: ownPl.length,
      s: "in portfolio"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Urgent",
      v: urg,
      s: "Injury / Contract",
      bg: "#FCEBEB",
      c: "#A32D2D"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Matches",
      v: nm,
      s: "AI today",
      bg: BB,
      c: B
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Deals",
      v: deals.filter(d => d.st < 4).length,
      s: fmt(totC),
      bg: "#EAF3DE",
      c: "#27500A"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Today's Alerts",
      action: unread > 0 ? "Mark all (" + unread + ")" : null,
      onAction: () => setAlts(a => a.map(x => ({
        ...x,
        r: true
      })))
    }), alts.slice(0, 5).map(a => /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 14px",
        borderTop: "0.5px solid var(--bd3)",
        background: a.r ? "transparent" : "var(--bg2)",
        cursor: "pointer"
      },
      onClick: () => setAlts(p => p.map(x => x.id === a.id ? {
        ...x,
        r: true
      } : x))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: a.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti " + a.ic,
      style: {
        fontSize: 12,
        color: a.tc
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "var(--tx1)"
      }
    }, a.tx), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        marginTop: 1
      }
    }, a.tm, " · ", a.tg)), !a.r && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: B,
        flexShrink: 0
      }
    })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Top Opportunities",
      action: "All matches →",
      onAction: () => setPg("mch")
    }), MATCHES.slice(0, 4).map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 14px",
        borderTop: "0.5px solid var(--bd3)",
        cursor: "pointer"
      },
      onClick: () => setPg("mch")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: sC(m.sc) + "1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: sC(m.sc),
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums"
      }
    }, m.sc), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "var(--tx1)"
      }
    }, m.p, " → ", m.tm), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        marginTop: 1
      }
    }, m.pos, " · ", m.src)), /*#__PURE__*/React.createElement(W, {
      id: "m" + i
    }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Team Budgets",
      action: "Details →",
      onAction: () => setPg("budg")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "4px 0"
      }
    }, BUDG.slice(0, 6).map((t, i) => {
      const pct = Math.round(t.u / t.b * 100);
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--tx3)",
          marginBottom: 3
        }
      }, /*#__PURE__*/React.createElement("span", null, t.t), /*#__PURE__*/React.createElement("span", {
        style: {
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", t.u, "K / €", t.b, "K")), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 14,
          background: "var(--bg3)",
          borderRadius: 3,
          overflow: "hidden",
          display: "flex"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: pct + "%",
          background: "#E1F5EE",
          borderRadius: 3
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          width: Math.round(t.u / t.b * 100 * 0.7) + "%",
          background: B,
          borderRadius: 3,
          marginLeft: 2
        }
      })));
    })))));
  }
  function Portfolio() {
    const tabs = [{
      id: "all",
      l: "All",
      n: ownPl.length
    }, {
      id: "injury",
      l: "Injury",
      n: ownPl.filter(p => p.st === "injury").length
    }, {
      id: "expiring",
      l: "Expiring",
      n: ownPl.filter(p => p.days <= 30 && p.st !== "free").length
    }, {
      id: "free",
      l: "Free",
      n: ownPl.filter(p => p.st === "free").length
    }, {
      id: "transfer_req",
      l: "Transfer request",
      n: ownPl.filter(p => p.st === "transfer_req").length
    }];
    let fp = ownPl;
    if (pF === "injury") fp = fp.filter(p => p.st === "injury");else if (pF === "expiring") fp = fp.filter(p => p.days <= 30 && p.st !== "free");else if (pF === "free") fp = fp.filter(p => p.st === "free");else if (pF === "transfer_req") fp = fp.filter(p => p.st === "transfer_req");
    if (srch) fp = fp.filter(p => p.n.includes(srch) || p.tm.includes(srch) || p.pos.includes(srch));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginBottom: 10,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: srch,
      onChange: e => setSrch(e.target.value),
      placeholder: "Search player, club, position...",
      style: {
        flex: 1,
        minWidth: 140,
        padding: "7px 12px",
        borderRadius: 8,
        border: "0.5px solid var(--bd2)",
        background: "var(--bg2)",
        color: "var(--tx1)",
        fontSize: 12
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginBottom: 10,
        flexWrap: "wrap"
      }
    }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => setPF(t.id),
      style: {
        padding: "5px 12px",
        borderRadius: 20,
        border: "0.5px solid " + (pF === t.id ? B : "var(--bd2)"),
        background: pF === t.id ? BB : "var(--bg2)",
        color: pF === t.id ? B : "var(--tx2)",
        fontSize: 11,
        cursor: "pointer",
        fontWeight: pF === t.id ? 700 : 400
      }
    }, t.l, " ", t.n > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        background: pF === t.id ? "#AFA9EC" : "var(--bd3)",
        padding: "0 5px",
        borderRadius: 8,
        fontSize: 10,
        marginRight: 3
      }
    }, t.n)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "26px 1fr 50px 80px 58px 52px 56px 68px 36px",
        padding: "7px 12px",
        background: "var(--bg2)",
        fontSize: 10,
        color: "var(--tx3)",
        fontWeight: 700,
        borderBottom: "0.5px solid var(--bd3)"
      }
    }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null, "Player"), /*#__PURE__*/React.createElement("span", null, "Pos"), /*#__PURE__*/React.createElement("span", null, "Club"), /*#__PURE__*/React.createElement("span", null, "Contract"), /*#__PURE__*/React.createElement("span", null, "Salary"), /*#__PURE__*/React.createElement("span", null, "Value"), /*#__PURE__*/React.createElement("span", null, "Status"), /*#__PURE__*/React.createElement("span", null, "AI")), fp.map(p => {
      const dc = dC(p.days),
        sl = stL(p.st);
      return /*#__PURE__*/React.createElement("div", {
        key: p.id,
        style: {
          display: "grid",
          gridTemplateColumns: "26px 1fr 50px 80px 58px 52px 56px 68px 36px",
          padding: "8px 12px",
          borderTop: "0.5px solid var(--bd3)",
          alignItems: "center",
          cursor: "pointer"
        },
        onClick: () => setModal(p),
        onMouseEnter: e => e.currentTarget.style.background = "var(--bg2)",
        onMouseLeave: e => e.currentTarget.style.background = "transparent"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: p.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          fontWeight: 700,
          color: p.tc
        }
      }, p.i2), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: "var(--tx1)"
        }
      }, p.n), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "var(--tx3)"
        }
      }, p.pp)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--tx2)"
        }
      }, p.pos), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--tx2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, p.tm), /*#__PURE__*/React.createElement(Pill, {
        l: dc.l,
        bg: dc.bg,
        tc: dc.tc
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: "var(--tx2)",
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", p.sal, "K"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: "var(--tx2)",
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", p.val, "K"), /*#__PURE__*/React.createElement(Pill, {
        l: sl.l,
        bg: sl.bg,
        tc: sl.tc
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: sC(p.sc),
          fontVariantNumeric: "tabular-nums"
        }
      }, p.sc));
    })));
  }
  function Discover() {
    const fm = mktPl.filter(p => !mktS || p.n.includes(mktS) || p.pos.includes(mktS) || p.pp.includes(mktS));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: mktS,
      onChange: e => setMktS(e.target.value),
      placeholder: "Search — position, nationality, club...",
      style: {
        padding: "7px 12px",
        borderRadius: 8,
        border: "0.5px solid var(--bd2)",
        background: "var(--bg2)",
        color: "var(--tx1)",
        fontSize: 12,
        width: "100%"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10
      }
    }, fm.map(p => {
      const sl = stL(p.st),
        dc = dC(p.days),
        claimed = ownPl.some(o => o.id === p.id);
      return /*#__PURE__*/React.createElement(Card, {
        key: p.id,
        style: {
          padding: "12px 14px"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: p.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: p.tc,
          flexShrink: 0,
          cursor: "pointer"
        },
        onClick: () => setModal({
          ...p,
          g: 0,
          a: 0,
          rat: 7.0,
          sal: p.sal,
          days: p.days
        })
      }, p.i2), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          cursor: "pointer"
        },
        onClick: () => setModal({
          ...p,
          g: 0,
          a: 0,
          rat: 7.0
        })
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "var(--tx1)"
        }
      }, p.n), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--tx3)"
        }
      }, p.pos, " · ", p.tm)), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 18,
          fontWeight: 700,
          color: sC(p.sc),
          fontVariantNumeric: "tabular-nums"
        }
      }, p.sc), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "var(--tx3)"
        }
      }, "AI"))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement(Pill, {
        l: sl.l,
        bg: sl.bg,
        tc: sl.tc
      }), /*#__PURE__*/React.createElement(Pill, {
        l: dc.l,
        bg: dc.bg,
        tc: dc.tc
      }), p.pp.includes("EU") && /*#__PURE__*/React.createElement(Pill, {
        l: "EU",
        bg: "#EAF3DE",
        tc: "#27500A"
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }
      }, /*#__PURE__*/React.createElement(W, {
        id: "mk" + p.id
      }), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          padding: "4px 11px",
          borderRadius: 7,
          border: "0.5px solid " + (claimed ? "#27500A" : B),
          background: claimed ? "#EAF3DE" : BB,
          color: claimed ? "#27500A" : B,
          cursor: "pointer"
        },
        onClick: () => {
          if (!claimed) {
            setOwnPl(o => [...o, {
              ...p,
              since: 2025,
              g: 0,
              a: 0,
              rat: 7.0,
              sal: p.sal,
              age: p.age || 24
            }]);
            setMktPl(m => m.filter(x => x.id !== p.id));
          }
        }
      }, claimed ? "✓ in portfolio" : "+ Add to Portfolio")));
    })));
  }
  function Matches() {
    const sw = MATCHES[swI % MATCHES.length];
    function doSwipe(dir) {
      if (dir === "right") setSaved(s => {
        const n = new Set(s);
        n.add(swI % MATCHES.length);
        return n;
      });
      setSwDir(dir);
      setTimeout(() => {
        setSwI(i => i + 1);
        setSwDir(null);
      }, 320);
    }
    let fm = MATCHES;
    if (mF === "high") fm = MATCHES.filter(m => m.urg === "high");else if (mF === "saved") fm = MATCHES.filter((_, i) => saved.has(i));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 12,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, [{
      id: "all",
      l: "All Matches"
    }, {
      id: "high",
      l: "Urgent"
    }, {
      id: "saved",
      l: "Saved (" + saved.size + ")"
    }].map(f => /*#__PURE__*/React.createElement("button", {
      key: f.id,
      onClick: () => setMF(f.id),
      style: {
        padding: "5px 14px",
        borderRadius: 20,
        border: "0.5px solid " + (mF === f.id ? B : "var(--bd2)"),
        background: mF === f.id ? BB : "var(--bg2)",
        color: mF === f.id ? B : "var(--tx2)",
        fontSize: 11,
        cursor: "pointer"
      }
    }, f.l)), /*#__PURE__*/React.createElement(Pill, {
      l: "Claude AI",
      bg: "#EAF3DE",
      tc: "#27500A",
      s: {
        marginRight: "auto"
      }
    })), mF === "all" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Card, {
      style: {
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        marginBottom: 8
      }
    }, MATCHES.length - swI % MATCHES.length, " cards remaining"), /*#__PURE__*/React.createElement("div", {
      style: {
        opacity: swDir ? 0 : 1,
        transform: swDir === "right" ? "translateX(50px)" : swDir === "left" ? "translateX(-50px)" : "none",
        transition: "all .3s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 42,
        height: 42,
        borderRadius: 10,
        background: sC(sw.sc) + "22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 700,
        color: sC(sw.sc),
        fontVariantNumeric: "tabular-nums"
      }
    }, sw.sc), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, sw.p), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "→ ", sw.tm, " · ", sw.pos))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx2)",
        marginBottom: 8,
        lineHeight: 1.5
      }
    }, sw.why), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginBottom: 8
      }
    }, sw.pros.map((p, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        fontSize: 10,
        background: "#EAF3DE",
        color: "#27500A",
        padding: "2px 6px",
        borderRadius: 5
      }
    }, "✓ ", p))), /*#__PURE__*/React.createElement(W, {
      id: "m" + swI % MATCHES.length,
      lg: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => doSwipe("left"),
      style: {
        flex: 1,
        padding: "8px",
        borderRadius: 8,
        border: "0.5px solid #E24B4A",
        background: "transparent",
        color: "#E24B4A",
        cursor: "pointer",
        fontSize: 12
      }
    }, "✕ Skip"), /*#__PURE__*/React.createElement("button", {
      onClick: () => doSwipe("right"),
      style: {
        flex: 1,
        padding: "8px",
        borderRadius: 8,
        border: "none",
        background: "#1D9E75",
        color: "#fff",
        cursor: "pointer",
        fontSize: 12
      }
    }, "✓ Contact"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, [{
      l: "Urgent",
      v: MATCHES.filter(m => m.urg === "high").length,
      bg: "#FCEBEB",
      c: "#A32D2D"
    }, {
      l: "Avg Score",
      v: Math.round(MATCHES.reduce((s, m) => s + m.sc, 0) / MATCHES.length),
      bg: BB,
      c: B
    }, {
      l: "Saved",
      v: saved.size,
      bg: "#EAF3DE",
      c: "#27500A"
    }].map((s, i) => /*#__PURE__*/React.createElement(Stat, {
      key: i,
      l: s.l,
      v: s.v,
      s: "",
      bg: s.bg,
      c: s.c
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, fm.map((m, i) => {
      const idx = MATCHES.indexOf(m);
      const co = Math.round(m.fee * 1000 * (commP / 100));
      return /*#__PURE__*/React.createElement(Card, {
        key: i,
        style: {
          padding: "12px 14px",
          borderColor: m.urg === "high" ? "#F0997B" : "var(--bd3)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 44,
          height: 44,
          borderRadius: 10,
          background: sC(m.sc) + "1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: sC(m.sc),
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums"
        }
      }, m.sc), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "var(--tx1)"
        }
      }, m.p, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--tx3)",
          fontWeight: 400
        }
      }, "→"), " ", m.tm), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--tx3)",
          marginTop: 2
        }
      }, m.pos, " · ", m.why)), m.urg === "high" && /*#__PURE__*/React.createElement(Pill, {
        l: "Urgent",
        bg: "#FCEBEB",
        tc: "#A32D2D"
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 5,
          marginBottom: 8,
          flexWrap: "wrap"
        }
      }, m.pros.map((p, j) => /*#__PURE__*/React.createElement("span", {
        key: j,
        style: {
          fontSize: 10,
          background: "#EAF3DE",
          color: "#27500A",
          padding: "2px 6px",
          borderRadius: 5
        }
      }, "✓ ", p)), m.cons.map((p, j) => /*#__PURE__*/React.createElement("span", {
        key: j,
        style: {
          fontSize: 10,
          background: "#F1EFE8",
          color: "#5F5E5A",
          padding: "2px 6px",
          borderRadius: 5
        }
      }, "⚠ ", p))), calcO === idx && /*#__PURE__*/React.createElement("div", {
        style: {
          background: "var(--bg2)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: "var(--tx2)",
          marginBottom: 6
        }
      }, "Commission Calc"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--tx3)"
        }
      }, "Transfer fee: ", /*#__PURE__*/React.createElement("b", {
        style: {
          color: "var(--tx1)",
          fontVariantNumeric: "tabular-nums"
        }
      }, fmt(m.fee), "K")), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--tx3)"
        }
      }, "Commission:"), [3, 5, 8, 10].map(p => /*#__PURE__*/React.createElement("button", {
        key: p,
        onClick: () => setCommP(p),
        style: {
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 6,
          border: "0.5px solid " + (commP === p ? B : "var(--bd2)"),
          background: commP === p ? BB : "transparent",
          color: commP === p ? B : "var(--tx2)",
          cursor: "pointer"
        }
      }, p, "%")), /*#__PURE__*/React.createElement("span", {
        style: {
          marginRight: "auto",
          fontSize: 13,
          fontWeight: 700,
          color: "#27500A",
          fontVariantNumeric: "tabular-nums"
        }
      }, fmt(co), " before tax"))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }
      }, /*#__PURE__*/React.createElement(W, {
        id: "m" + idx
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          padding: "4px 10px",
          borderRadius: 7,
          border: "0.5px solid " + (calcO === idx ? B : "var(--bd2)"),
          background: calcO === idx ? BB : "var(--bg2)",
          color: calcO === idx ? B : "var(--tx2)",
          cursor: "pointer"
        },
        onClick: () => setCalcO(calcO === idx ? null : idx)
      }, "🧮 Commission"), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          padding: "4px 10px",
          borderRadius: 7,
          border: "0.5px solid " + (saved.has(idx) ? B : "var(--bd2)"),
          background: saved.has(idx) ? BB : "var(--bg2)",
          color: saved.has(idx) ? B : "var(--tx2)",
          cursor: "pointer"
        },
        onClick: () => setSaved(s => {
          const n = new Set(s);
          s.has(idx) ? n.delete(idx) : n.add(idx);
          return n;
        })
      }, saved.has(idx) ? "★" : "☆"), /*#__PURE__*/React.createElement("button", {
        style: {
          fontSize: 11,
          padding: "4px 11px",
          borderRadius: 7,
          border: "none",
          background: B,
          color: "#EEEDFE",
          cursor: "pointer"
        },
        onClick: () => {
          setDeals(d => [...d, {
            id: Date.now(),
            p: m.p,
            fr: m.p,
            to: m.tm,
            fee: m.fee,
            st: 0,
            din: 0,
            comm: co,
            bg: m.bg,
            tc: m.tc
          }]);
          alert("Moved to CRM! Commission: " + fmt(co));
        }
      }, "→ CRM"))));
    })));
  }
  function Pipeline() {
    const byS = i => deals.filter(d => d.st === i);
    const mv = (id, dir) => setDeals(d => d.map(x => x.id === id ? {
      ...x,
      st: Math.max(0, Math.min(4, x.st + dir))
    } : x));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 8,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      l: "Total Pipeline",
      v: deals.length,
      s: "Deals"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Potential Commission",
      v: fmt(totC),
      s: "",
      bg: BB,
      c: B
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "At Signing",
      v: deals.filter(d => d.st === 3).length,
      s: "Deals",
      bg: "#EAF3DE",
      c: "#27500A"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Avg. Time",
      v: "14d",
      s: "to close"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 8
      }
    }, STAGES.map((st, si) => /*#__PURE__*/React.createElement("div", {
      key: si,
      style: {
        minWidth: 178,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      l: st,
      bg: SBG[si],
      tc: STC[si]
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        background: "var(--bg2)",
        padding: "1px 7px",
        borderRadius: 8
      }
    }, byS(si).length)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "var(--tx3)",
        fontVariantNumeric: "tabular-nums"
      }
    }, fmt(byS(si).reduce((s, d) => s + d.comm, 0)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 7
      }
    }, byS(si).map(d => /*#__PURE__*/React.createElement("div", {
      key: d.id,
      style: {
        background: "var(--bg1)",
        border: "0.5px solid var(--bd3)",
        borderRadius: 10,
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: d.bg || BB,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
        fontWeight: 700,
        color: d.tc || B,
        flexShrink: 0
      }
    }, d.p.split(" ").slice(0, 2).map(w => w[0]).join("")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "var(--tx1)"
      }
    }, d.p), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "var(--tx3)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, d.fr, " → ", d.to))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#27500A",
        fontVariantNumeric: "tabular-nums"
      }
    }, fmt(d.comm)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "var(--tx3)"
      }
    }, d.din, " days")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, si > 0 && /*#__PURE__*/React.createElement("button", {
      onClick: () => mv(d.id, -1),
      style: {
        flex: 1,
        padding: "3px",
        borderRadius: 5,
        border: "0.5px solid var(--bd2)",
        background: "transparent",
        color: "var(--tx3)",
        cursor: "pointer",
        fontSize: 10
      }
    }, "← Back"), si < 4 && /*#__PURE__*/React.createElement("button", {
      onClick: () => mv(d.id, 1),
      style: {
        flex: 1,
        padding: "3px",
        borderRadius: 5,
        border: "0.5px solid " + B,
        background: BB,
        color: B,
        cursor: "pointer",
        fontSize: 10
      }
    }, si === 3 ? "✓ Close" : "Advance →")))), byS(si).length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        border: "0.5px dashed var(--bd2)",
        borderRadius: 10,
        padding: "16px",
        textAlign: "center",
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "No deals"))))));
  }
  function Budget() {
    const tot = BUDG.reduce((s, t) => s + t.b, 0),
      used = BUDG.reduce((s, t) => s + t.u, 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      l: "Total Budget",
      v: "€" + (tot / 1000).toFixed(1) + "M",
      s: ""
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Used",
      v: "€" + (used / 1000).toFixed(1) + "M",
      s: "",
      bg: "#FCEBEB",
      c: "#A32D2D"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Available",
      v: "€" + ((tot - used) / 1000).toFixed(1) + "M",
      s: "",
      bg: "#EAF3DE",
      c: "#27500A"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Budget vs Usage"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 0"
      }
    }, BUDG.map((t, i) => {
      const pct = Math.round(t.u / t.b * 100);
      const bc = pct > 85 ? "#E24B4A" : pct > 65 ? "#EF9F27" : "#1D9E75";
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          marginBottom: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 600,
          color: "var(--tx1)"
        }
      }, t.t), /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--tx3)",
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", t.u, "K / €", t.b, "K")), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 16,
          background: "var(--bg3)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: pct + "%",
          height: "100%",
          background: bc,
          borderRadius: 4,
          transition: "width .4s"
        }
      })));
    })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Utilization %"
    }), BUDG.map((t, i) => {
      const p = Math.round(t.u / t.b * 100),
        bc = p > 85 ? "#E24B4A" : p > 65 ? "#EF9F27" : "#1D9E75";
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          padding: "9px 14px",
          borderTop: i > 0 ? "0.5px solid var(--bd3)" : "none"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: "var(--tx1)"
        }
      }, t.t), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "var(--tx3)",
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", t.u, "K / €", t.b, "K · ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: bc,
          fontWeight: 700
        }
      }, p, "%"))), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 5,
          background: "var(--bg2)",
          borderRadius: 3,
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          height: "100%",
          width: p + "%",
          background: bc,
          borderRadius: 3
        }
      })));
    })));
  }
  function Calendar() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: PIT,
        borderRadius: 12,
        padding: 20,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "rgba(255,255,255,.4)",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: ".08em"
      }
    }, "Transfer window closes in"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "center",
        gap: 20
      }
    }, [{
      v: wD,
      l: "days"
    }, {
      v: wH,
      l: "hours"
    }, {
      v: wM,
      l: "minutes"
    }, {
      v: wS,
      l: "seconds"
    }].map((u, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34,
        fontWeight: 700,
        color: "#22C55E",
        fontVariantNumeric: "tabular-nums",
        minWidth: 46
      }
    }, pad(u.v)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(255,255,255,.35)",
        marginTop: 2
      }
    }, u.l)))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: "rgba(255,255,255,.1)",
        borderRadius: 2,
        marginTop: 14,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: Math.max(2, secs / (90 * 86400) * 100).toFixed(1) + "%",
        background: "#22C55E",
        borderRadius: 2
      }
    }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Timeline — Contracts & Windows"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 14px 12px"
      }
    }, [{
      d: "11.06.25",
      l: "Amit Shahar — contract expired",
      bg: "#EAF3DE",
      tc: "#27500A"
    }, {
      d: "19.06.25",
      l: "Jordan LaRose + Ben Levi",
      bg: "#FCEBEB",
      tc: "#A32D2D"
    }, {
      d: "23.06.25",
      l: "Dian Civita",
      bg: "#FCEBEB",
      tc: "#A32D2D"
    }, {
      d: "01.07.25",
      l: "Summer window opens",
      bg: "#E1F5EE",
      tc: "#085041"
    }, {
      d: "15.08.25",
      l: "Goncalo Figueiredo",
      bg: "#FAEEDA",
      tc: "#633806"
    }, {
      d: "31.08.25",
      l: "Summer window closes",
      bg: "#FCEBEB",
      tc: "#A32D2D"
    }].map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 0",
        borderTop: i > 0 ? "0.5px solid var(--bd3)" : "none"
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      l: e.d,
      bg: e.bg,
      tc: e.tc,
      s: {
        minWidth: 64,
        textAlign: "center",
        fontVariantNumeric: "tabular-nums"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, e.l))))));
  }
  function Analytics() {
    const totC2 = COMM_H.reduce((s, m) => s + m.c, 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      l: "Closed Deals",
      v: "7",
      s: "2024/25"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Total Commission",
      v: fmt(totC2),
      s: "",
      bg: BB,
      c: B
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Success Rate",
      v: "68%",
      s: "",
      bg: "#EAF3DE",
      c: "#27500A"
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Avg per Deal",
      v: fmt(Math.round(totC2 / 7)),
      s: "",
      bg: "#FAEEDA",
      c: "#633806"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Monthly Commission — 2025"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 0 0"
      }
    }, COMM_H.map((m, i) => {
      const max = Math.max(...COMM_H.map(x => x.c));
      const pct = max > 0 ? Math.round(m.c / max * 100) : 0;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 24,
          fontSize: 10,
          color: "var(--tx3)"
        }
      }, m.m), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          height: 18,
          background: "var(--bg3)",
          borderRadius: 3,
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: pct + "%",
          height: "100%",
          background: BB,
          borderRadius: 3,
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          right: 0,
          top: 0,
          width: "3px",
          height: "100%",
          background: B,
          borderRadius: "0 3px 3px 0"
        }
      }))), /*#__PURE__*/React.createElement("span", {
        style: {
          width: 56,
          fontSize: 10,
          color: "var(--tx3)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums"
        }
      }, "€", m.c.toLocaleString()));
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Card, {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 10
      }
    }, "Players by Status"), [{
      l: "Active",
      n: ownPl.filter(p => p.st === "active").length,
      c: "#27500A"
    }, {
      l: "Expiring",
      n: ownPl.filter(p => p.days <= 30 && p.st !== "free").length,
      c: "#633806"
    }, {
      l: "Injury",
      n: ownPl.filter(p => p.st === "injury").length,
      c: "#A32D2D"
    }, {
      l: "Free",
      n: ownPl.filter(p => p.st === "free").length,
      c: "#27500A"
    }, {
      l: "Transfer request",
      n: ownPl.filter(p => p.st === "transfer_req").length,
      c: B
    }].map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderTop: i > 0 ? "0.5px solid var(--bd3)" : "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: s.c,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12,
        color: "var(--tx1)"
      }
    }, s.l), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: s.c,
        fontVariantNumeric: "tabular-nums"
      }
    }, s.n)))), /*#__PURE__*/React.createElement(Card, {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 10
      }
    }, "Market Trend"), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 0 0",
        position: "relative",
        height: 140
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 280 120",
      style: {
        width: "100%",
        height: "100%",
        overflow: "visible"
      }
    }, /*#__PURE__*/React.createElement("polyline", {
      points: TREND.map((d, i) => {
        const max = Math.max(...TREND.map(x => x.v));
        const min = Math.min(...TREND.map(x => x.v));
        const x = i * (280 / (TREND.length - 1));
        const y = 100 - (d.v - min) / (max - min || 1) * 90;
        return x + "," + y;
      }).join(" "),
      fill: "none",
      stroke: B,
      strokeWidth: "2",
      strokeLinejoin: "round"
    }), TREND.map((d, i) => {
      const max = Math.max(...TREND.map(x => x.v));
      const min = Math.min(...TREND.map(x => x.v));
      const x = i * (280 / (TREND.length - 1));
      const y = 100 - (d.v - min) / (max - min || 1) * 90;
      return /*#__PURE__*/React.createElement("g", {
        key: i
      }, /*#__PURE__*/React.createElement("circle", {
        cx: x,
        cy: y,
        r: "4",
        fill: B
      }), /*#__PURE__*/React.createElement("text", {
        x: x,
        y: 120,
        textAnchor: "middle",
        fontSize: "9",
        fill: "var(--tx3)"
      }, d.m), /*#__PURE__*/React.createElement("text", {
        x: x,
        y: y - 8,
        textAnchor: "middle",
        fontSize: "8",
        fill: B
      }, "€", d.v, "K"));
    }))))));
  }
  function Network() {
    const ag = [{
      n: "Joseph Cohen",
      s: "Premier League · CBs",
      m: 3,
      av: "Y.K",
      bg: BB,
      tc: B
    }, {
      n: "Margaret Levi",
      s: "League A · Forwards",
      m: 1,
      av: "M.L",
      bg: "#E1F5EE",
      tc: "#085041"
    }, {
      n: "David Baruch",
      s: "Spain · EU",
      m: 5,
      av: "D.B",
      bg: "#FAECE7",
      tc: "#712B13"
    }, {
      n: "Naomi Sharon",
      s: "Turkey · Midfielders",
      m: 2,
      av: "N.S",
      bg: "#FAEEDA",
      tc: "#633806"
    }, {
      n: "Amir Gabay",
      s: "Goalkeepers",
      m: 4,
      av: "A.G",
      bg: "#E6F1FB",
      tc: "#0C447C"
    }];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      l: "Connections",
      v: "23",
      s: ""
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Requests",
      v: "4",
      s: "",
      bg: BB,
      c: B
    }), /*#__PURE__*/React.createElement(Stat, {
      l: "Collaborations",
      v: "7",
      s: "",
      bg: "#EAF3DE",
      c: "#27500A"
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardH, {
      title: "Recommended Agents"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 14px 10px"
      }
    }, ag.map((a, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderTop: i > 0 ? "0.5px solid var(--bd3)" : "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: a.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: a.tc,
        flexShrink: 0
      }
    }, a.av), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, a.n), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)"
      }
    }, a.s, " · ", a.m, " mutual connections")), /*#__PURE__*/React.createElement(W, {
      id: "n" + i
    }), /*#__PURE__*/React.createElement("button", {
      style: {
        fontSize: 11,
        padding: "4px 12px",
        borderRadius: 8,
        border: "0.5px solid " + B,
        background: "transparent",
        color: B,
        cursor: "pointer"
      }
    }, "Connect"))))));
  }
  function Settings() {
    async function saveChannels() {
      setSavedCh('saving');
      try {
        const u = window._T365 || {};
        await fetch('/api/save-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: u.email || 'anonymous',
            email: u.email || '',
            channels,
            timing: 'immediate'
          })
        });
        setSavedCh('savedCh');
      } catch (e) {
        setSavedCh('error');
      }
      setTimeout(() => setSavedCh(false), 2500);
    }
    async function testChannel(ch) {
      const u = window._T365 || {};
      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: u.email || 'anonymous',
          channel: ch
        })
      });
      const data = await res.json();
      alert(data.success ? '✅ Test notification sent!' : '❌ Error: ' + (data.error || 'Unknown'));
    }
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, "Manage Alerts"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)",
        marginTop: 2
      }
    }, "~", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        color: B,
        fontVariantNumeric: "tabular-nums"
      }
    }, wkly), " alerts/week")), /*#__PURE__*/React.createElement("button", {
      onClick: saveChannels,
      style: {
        fontSize: 11,
        padding: "7px 16px",
        borderRadius: 8,
        border: "none",
        background: savedCh === 'savedCh' ? '#1D9E75' : savedCh === 'error' ? '#E24B4A' : B,
        color: "#EEEDFE",
        cursor: "pointer",
        fontWeight: 700,
        transition: "background .3s"
      }
    }, savedCh === 'saving' ? 'Saving...' : savedCh === 'savedCh' ? '✓ Saved!' : savedCh === 'error' ? '❌ Error' : 'Save Settings')), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg1)",
        border: "0.5px solid var(--bd3)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 14px",
        background: "var(--bg2)",
        borderBottom: "0.5px solid var(--bd3)",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--tx3)",
        textTransform: "uppercase",
        letterSpacing: ".07em",
        display: "flex",
        justifyContent: "space-between"
      }
    }, "Notification Channels", /*#__PURE__*/React.createElement("span", {
      style: {
        color: B
      }
    }, Object.values(channels).filter(c => c.on).length, "/", Object.keys(channels).length, " active")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px",
        borderBottom: "0.5px solid var(--bd3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: channels.email.on ? 10 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "#E1F5EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-mail",
      style: {
        fontSize: 16,
        color: "#085041"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, "Email"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "Receive alerts directly by email")), /*#__PURE__*/React.createElement("div", {
      onClick: () => setChannels(c => ({
        ...c,
        email: {
          ...c.email,
          on: !c.email.on
        }
      })),
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: channels.email.on ? "#534AB7" : "var(--bd2)",
        position: "relative",
        transition: "background .2s",
        cursor: "pointer",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: channels.email.on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .2s"
      }
    }))), channels.email.on && /*#__PURE__*/React.createElement("input", {
      value: channels.email.val,
      onChange: e => setChannels(c => ({
        ...c,
        email: {
          ...c.email,
          val: e.target.value
        }
      })),
      placeholder: "Email address...",
      style: {
        width: "100%",
        padding: "7px 10px",
        borderRadius: 7,
        border: "0.5px solid var(--bd2)",
        background: "var(--bg2)",
        color: "var(--tx1)",
        fontSize: 12,
        direction: "ltr",
        boxSizing: "border-box"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px",
        borderBottom: "0.5px solid var(--bd3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: channels.whatsapp.on ? 10 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "#E1F5EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-brand-whatsapp",
      style: {
        fontSize: 16,
        color: "#25D366"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, "WhatsApp"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "WhatsApp messages to your phone")), /*#__PURE__*/React.createElement("div", {
      onClick: () => setChannels(c => ({
        ...c,
        whatsapp: {
          ...c.whatsapp,
          on: !c.whatsapp.on
        }
      })),
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: channels.whatsapp.on ? "#25D366" : "var(--bd2)",
        position: "relative",
        transition: "background .2s",
        cursor: "pointer",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: channels.whatsapp.on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .2s"
      }
    }))), channels.whatsapp.on && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      value: channels.whatsapp.val,
      onChange: e => setChannels(c => ({
        ...c,
        whatsapp: {
          ...c.whatsapp,
          val: e.target.value
        }
      })),
      placeholder: "+972501234567",
      style: {
        width: "100%",
        padding: "7px 10px",
        borderRadius: 7,
        border: "0.5px solid var(--bd2)",
        background: "var(--bg2)",
        color: "var(--tx1)",
        fontSize: 12,
        direction: "ltr",
        boxSizing: "border-box",
        marginBottom: 6
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-info-circle",
      style: {
        fontSize: 12
      }
    }), " Sent via WhatsApp Business API"), /*#__PURE__*/React.createElement("button", {
      onClick: () => testChannel('whatsapp'),
      style: {
        marginTop: 6,
        fontSize: 11,
        padding: "4px 12px",
        borderRadius: 7,
        border: "0.5px solid #25D366",
        background: "rgba(37,211,102,.1)",
        color: "#25D366",
        cursor: "pointer"
      }
    }, "💬 Send Test WhatsApp"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px",
        borderBottom: "0.5px solid var(--bd3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: channels.telegram.on ? 10 : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "#E6F1FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-brand-telegram",
      style: {
        fontSize: 16,
        color: "#229ED9"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, "Telegram"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "Alerts via Telegram Bot")), /*#__PURE__*/React.createElement("div", {
      onClick: () => setChannels(c => ({
        ...c,
        telegram: {
          ...c.telegram,
          on: !c.telegram.on
        }
      })),
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: channels.telegram.on ? "#229ED9" : "var(--bd2)",
        position: "relative",
        transition: "background .2s",
        cursor: "pointer",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: channels.telegram.on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .2s"
      }
    }))), channels.telegram.on && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      value: channels.telegram.val,
      onChange: e => setChannels(c => ({
        ...c,
        telegram: {
          ...c.telegram,
          val: e.target.value
        }
      })),
      placeholder: "Telegram Chat ID or @username",
      style: {
        width: "100%",
        padding: "7px 10px",
        borderRadius: 7,
        border: "0.5px solid var(--bd2)",
        background: "var(--bg2)",
        color: "var(--tx1)",
        fontSize: 12,
        direction: "ltr",
        boxSizing: "border-box",
        marginBottom: 6
      }
    }), /*#__PURE__*/React.createElement("a", {
      href: "https://t.me/Transfer365Bot",
      target: "_blank",
      rel: "noreferrer",
      style: {
        fontSize: 11,
        color: B,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-external-link",
      style: {
        fontSize: 12
      }
    }), " Open Transfer365Bot on Telegram to get your Chat ID"), /*#__PURE__*/React.createElement("button", {
      onClick: () => testChannel('telegram'),
      style: {
        marginTop: 6,
        fontSize: 11,
        padding: "4px 12px",
        borderRadius: 7,
        border: "0.5px solid #229ED9",
        background: "rgba(34,158,217,.1)",
        color: "#229ED9",
        cursor: "pointer"
      }
    }, "✈️ Send Test Telegram"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "#FAEEDA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti ti-bell-ringing",
      style: {
        fontSize: 16,
        color: "#633806"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, "Push — Browser"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tx3)"
      }
    }, "Browser push notifications")), /*#__PURE__*/React.createElement("div", {
      onClick: () => setChannels(c => ({
        ...c,
        push: {
          ...c.push,
          on: !c.push.on
        }
      })),
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: channels.push.on ? "#EF9F27" : "var(--bd2)",
        position: "relative",
        transition: "background .2s",
        cursor: "pointer",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: channels.push.on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .2s"
      }
    }))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg1)",
        border: "0.5px solid var(--bd3)",
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--tx3)",
        textTransform: "uppercase",
        letterSpacing: ".07em",
        marginBottom: 10
      }
    }, "Send Timing"), [{
      l: "Immediate",
      s: "As soon as the event occurs",
      ic: "ti-bolt",
      active: true
    }, {
      l: "Morning Digest",
      s: "07:30 daily",
      ic: "ti-sunrise",
      active: false
    }, {
      l: "Weekly Digest",
      s: "Sunday 09:00",
      ic: "ti-calendar-week",
      active: false
    }].map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        borderTop: i > 0 ? "0.5px solid var(--bd3)" : "none"
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti " + t.ic,
      style: {
        fontSize: 15,
        color: t.active ? B : "var(--tx3)",
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, t.l), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)"
      }
    }, t.s)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: t.active ? B : "var(--bd2)",
        position: "relative",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: t.active ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff"
      }
    }))))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--tx1)",
        marginBottom: 10
      }
    }, "Alert Types"), trigs.map((cat, ci) => /*#__PURE__*/React.createElement(Card, {
      key: ci,
      style: {
        overflow: "hidden",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 14px",
        background: "var(--bg2)",
        borderBottom: "0.5px solid var(--bd3)",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--tx3)",
        textTransform: "uppercase",
        letterSpacing: ".07em",
        display: "flex",
        justifyContent: "space-between"
      }
    }, cat.lb, /*#__PURE__*/React.createElement("span", {
      style: {
        color: B
      }
    }, cat.its.filter(t => t.on).length, "/", cat.its.length, " active")), cat.its.map((it, ii) => /*#__PURE__*/React.createElement("div", {
      key: ii,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderTop: ii > 0 ? "0.5px solid var(--bd3)" : "none",
        cursor: "pointer"
      },
      onClick: () => setTrigs(p => p.map((c, x) => x !== ci ? c : {
        ...c,
        its: c.its.map((t, y) => y !== ii ? t : {
          ...t,
          on: !t.on
        })
      }))
    }, /*#__PURE__*/React.createElement("i", {
      className: "ti " + it.ic,
      style: {
        fontSize: 15,
        color: it.on ? B : "var(--tx3)",
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tx1)"
      }
    }, it.n), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--tx3)",
        marginTop: 1
      }
    }, "~", it.w, " /week · ", it.id)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: it.on ? BL : "var(--bd2)",
        position: "relative",
        transition: "background .2s",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 2,
        left: it.on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left .2s"
      }
    })))))));
  }
  const PAGES = {
    dash: /*#__PURE__*/React.createElement(Dash, null),
    port: /*#__PURE__*/React.createElement(Portfolio, null),
    disc: /*#__PURE__*/React.createElement(Discover, null),
    mch: /*#__PURE__*/React.createElement(Matches, null),
    pipe: /*#__PURE__*/React.createElement(Pipeline, null),
    budg: /*#__PURE__*/React.createElement(Budget, null),
    cal: /*#__PURE__*/React.createElement(Calendar, null),
    anl: /*#__PURE__*/React.createElement(Analytics, null),
    net: /*#__PURE__*/React.createElement(Network, null),
    set: /*#__PURE__*/React.createElement(Settings, null)
  };
  return /*#__PURE__*/React.createElement("div", {
    dir: "rtl",
    style: {
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      background: "var(--bg3)",
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement(PlayerModal, null), /*#__PURE__*/React.createElement("div", {
    style: {
      background: PIT,
      padding: "6px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      overflow: "hidden",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#22C55E",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#22C55E",
      letterSpacing: ".08em",
      flexShrink: 0
    }
  }, "LIVE"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 12,
      background: "rgba(255,255,255,.15)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,.75)",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      flex: 1
    }
  }, TICKER[ti]), unread > 0 && /*#__PURE__*/React.createElement(Pill, {
    l: unread + " new",
    bg: "#E24B4A",
    tc: "#fff",
    s: {
      flexShrink: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 154,
      background: "#111827",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px 8px",
      borderBottom: "0.5px solid rgba(255,255,255,.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-transfer",
    style: {
      fontSize: 15,
      color: BL
    }
  }), "Transfer365"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "rgba(255,255,255,.3)",
      marginTop: 3
    }
  }, window._T365 && (window._T365.full_name || (window._T365.email || '').split('@')[0]) || 'Agent', " · ", window._T365 && window._T365.plan || 'Premium')), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      padding: "5px 0",
      overflowY: "auto"
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    onClick: () => setPg(n.id),
    style: {
      width: "100%",
      padding: "8px 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: pg === n.id ? "rgba(83,74,183,.3)" : "transparent",
      border: "none",
      borderRight: pg === n.id ? "2px solid " + BL : "2px solid transparent",
      cursor: "pointer",
      transition: "background .15s"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti " + n.ic,
    style: {
      fontSize: 14,
      color: pg === n.id ? "#AFA9EC" : "rgba(255,255,255,.4)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: pg === n.id ? "#fff" : "rgba(255,255,255,.45)",
      fontWeight: pg === n.id ? 700 : 400
    }
  }, n.l), n.id === "set" && unread > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: "auto",
      width: 15,
      height: 15,
      borderRadius: "50%",
      background: "#E24B4A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 8,
      color: "#fff",
      fontWeight: 700
    }
  }, unread)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderTop: "0.5px solid rgba(255,255,255,.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "rgba(255,255,255,.3)",
      marginBottom: 3
    }
  }, "Window closes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#22C55E",
      fontVariantNumeric: "tabular-nums"
    }
  }, wD, "d ", pad(wH), ":", pad(wM)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: "rgba(255,255,255,.1)",
      borderRadius: 2,
      marginTop: 4,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.max(2, secs / (90 * 86400) * 100).toFixed(1) + "%",
      background: "#22C55E",
      borderRadius: 2
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: 14,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--tx1)",
      margin: 0
    }
  }, (NAV.find(n => n.id === pg) || {
    l: ""
  }).l), pg === "port" && /*#__PURE__*/React.createElement(Pill, {
    l: ownPl.length + " Players",
    bg: BB,
    tc: B
  }), pg === "mch" && /*#__PURE__*/React.createElement(Pill, {
    l: MATCHES.length + " Matches",
    bg: "#EAF3DE",
    tc: "#27500A"
  }), pg === "pipe" && /*#__PURE__*/React.createElement(Pill, {
    l: fmt(totC) + " in pipeline",
    bg: "#EAF3DE",
    tc: "#27500A"
  }), pg === "set" && /*#__PURE__*/React.createElement(Pill, {
    l: wkly + " /week",
    bg: BB,
    tc: B
  })), PAGES[pg] || PAGES.dash)));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
