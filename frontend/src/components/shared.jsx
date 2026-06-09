const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const SEGMENTS_API_URL = `${API_BASE}/api/assets/segments`;
const BACKGROUNDS_API_URL = `${API_BASE}/api/assets/backgrounds`;
const HISTORY_API_URL = `${API_BASE}/api/history/`;

const PLATFORMS = [
  { name: "Poster",    ratio: "3:4",  width: 900,  height: 1200, icon: "image"     },
  { name: "Instagram", ratio: "1:1",  width: 1080, height: 1080, icon: "instagram" },
  { name: "WhatsApp",  ratio: "9:16", width: 1080, height: 1920, icon: "whatsapp"  },
  { name: "Facebook",  ratio: "4:3",  width: 1200, height: 900,  icon: "facebook"  },
];

const LANGUAGES = [
  "English","Hindi","Kannada","Gujarati","Bengali","Marathi",
  "Tamil","Telugu","Malayalam","Assamese","Punjabi","Odia",
];

const OFFER_TYPES = [
  { id: "pre_booking_offer",       label: "Pre Booking Offer",       typeOptions: ["STARTING", "UPTO"] },
  { id: "credit_card_offer",       label: "Credit Card Offer",       typeOptions: ["FLAT", "UPTO"] },
  { id: "cash_bonus",              label: "Cash Bonus",              typeOptions: ["FLAT", "UPTO"] },
  { id: "exchange_offer",          label: "Exchange Offer",          typeOptions: ["FLAT", "UPTO"] },
  { id: "loyalty_bonus",           label: "Loyalty Bonus",           typeOptions: ["FLAT", "UPTO"] },
  { id: "low_rate_interest",       label: "Low Rate of Interest",    typeOptions: ["STARTING", "UPTO"] },
  { id: "low_down_payment",        label: "Low Down Payment",        typeOptions: ["STARTING", "UPTO"] },
  { id: "gst_benefit",             label: "GST Benefit",             typeOptions: ["FLAT", "UPTO"] },
  { id: "green_bonus",             label: "Green Bonus",             typeOptions: ["FLAT", "UPTO"] },
  { id: "flipkart_discount_offer", label: "Flipkart Discount Offer", typeOptions: ["FLAT", "UPTO"] },
  { id: "amazon_offer",            label: "Amazon Offer",            typeOptions: ["FLAT", "UPTO"] },
  { id: "corporate_offer",         label: "Corporate Offer",         typeOptions: ["FLAT", "UPTO"] },
];

const NO_OFFER_ID = "no_offer";

const STAT_CARDS = [
  { value: "10K+", label: "Creators", icon: "users" },
  { value: "<2s", label: "Setup Flow", icon: "zap" },
  { value: "12", label: "Languages", icon: "globe" },
  { value: "4", label: "Export Sizes", icon: "image" },
];

const HERO_PARTICLES = [
  { cls: "particle-red animate-pulse",    top: "12%", left: "8%",   size: 92,  opacity: 0.22, blur: "18px", delay: "0s"    },
  { cls: "particle-gold animate-bounce",  top: "22%", right: "14%", size: 58,  opacity: 0.26, blur: "12px", delay: ".35s"  },
  { cls: "particle-blue animate-pulse",   top: "64%", left: "15%",  size: 42,  opacity: 0.18, blur: "10px", delay: ".7s"   },
  { cls: "particle-red animate-bounce",   top: "70%", right: "20%", size: 76,  opacity: 0.18, blur: "16px", delay: ".15s"  },
  { cls: "particle-white animate-pulse",  top: "38%", left: "29%",  size: 24,  opacity: 0.34, blur: "6px",  delay: "1.1s"  },
  { cls: "particle-gold animate-bounce",  top: "16%", left: "72%",  size: 30,  opacity: 0.28, blur: "8px",  delay: ".95s"  },
  { cls: "particle-blue animate-pulse",   top: "54%", right: "6%",  size: 118, opacity: 0.12, blur: "24px", delay: "1.45s" },
  { cls: "particle-white animate-bounce", bottom: "18%", left: "45%", size: 18, opacity: 0.38, blur: "5px", delay: ".55s" },
];

const ICON_PATHS = {
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  image: [
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z",
    "m3 16 5-5 4 4 3-3 6 6",
    "M8.5 8.5h.01",
  ],
  globe: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M2 12h20",
    "M12 2a15.3 15.3 0 0 1 0 20",
    "M12 2a15.3 15.3 0 0 0 0 20",
  ],
  zap: ["M13 2 3 14h9l-1 8 10-12h-9l1-8Z"],
  instagram: [
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z",
    "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z",
    "M17.5 6.5h.01",
  ],
  whatsapp: [
    "M20.52 3.48A11.82 11.82 0 0 0 3.48 20.52L2 22l3.3-.87A11.82 11.82 0 0 0 20.52 3.48Z",
    "M8.5 8.75c.38 3.45 2.78 5.87 6.73 6.75.5.11 1-.1 1.28-.52l.58-.86c.16-.24.08-.56-.18-.7l-1.96-1.04c-.22-.12-.49-.07-.65.12l-.7.82c-1.24-.48-2.3-1.35-3.02-2.62l.8-.68c.19-.16.24-.43.12-.65L10.46 7.4c-.14-.26-.47-.34-.7-.18l-.86.58c-.35.24-.53.56-.4.95Z",
  ],
  facebook: ["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.5l.5-4h-4V7a1 1 0 0 1 1-1h3V2Z"],
};

const OFFER_HINTS = {
  pre_booking_offer: "STARTING ₹999",
  credit_card_offer: "FLAT ₹2500",
  cash_bonus: "UPTO ₹5000",
  exchange_offer: "UPTO ₹8000",
  loyalty_bonus: "FLAT ₹3000",
  low_rate_interest: "STARTING 6.99%",
  low_down_payment: "STARTING ₹9999",
  gst_benefit: "FLAT ₹4000",
  green_bonus: "UPTO ₹3000",
  flipkart_discount_offer: "FLAT ₹1500",
  amazon_offer: "UPTO ₹2000",
  corporate_offer: "FLAT ₹3500",
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

const mockImageUrl = (text, bg = "e2e8f0", fg = "1e293b", size = "600x400") =>
  `https://placehold.co/${size}/${bg}/${fg}?text=${encodeURIComponent(text).replace(/%20/g, "+")}`;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAssetUrl = (url) => {
  if (!url) return "";
  if (/^(data:|blob:|https?:)/i.test(url)) return url;
  
  const path = url.startsWith("/") ? url : `/${url}`;
  
  if (path.startsWith("/assets") || path.startsWith("/outputs")) {
    try {
      // FIXED: Decode first to remove any existing %20, then encode exactly once.
      // This prevents React from double-encoding spaces into %2520.
      const cleanPath = decodeURI(path);
      return encodeURI(`${API_BASE}${cleanPath}`);
    } catch (e) {
      return encodeURI(`${API_BASE}${path}`);
    }
  }
  
  return path;
};

const makeAbsoluteUrl = (url) => {
  const resolved = getAssetUrl(url);
  if (!resolved) return "";
  if (/^(data:|blob:|https?:)/i.test(resolved)) return resolved;
  if (typeof window === "undefined") return resolved;
  return new URL(resolved, window.location.origin).href;
};

const formatOfferValue = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return /^[₹$€£]|\d\s*%$/.test(trimmed) ? trimmed : `₹${trimmed}`;
};

const formatHistoryTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const time = new Date(timestamp);
  if (Number.isNaN(time.getTime())) return timestamp;
  const diff = Date.now() - time.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return time.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Endpoint ${url} returned ${res.status} ${res.statusText || ""}`.trim());
  return { data: await res.json() };
};

const MOCK_GENERATED_IMAGE_URL = mockImageUrl("Mock Poster Generated", "dc2626", "ffffff", "900x1200");

const getSegmentIcon = (segmentName = "") => {
  const normalized = String(segmentName).toLowerCase();
  if (normalized.includes("scooter")) return "users";
  if (normalized.includes("premium")) return "globe";
  if (normalized.includes("cc")) return "zap";
  return "image";
};

const normalizeModels = (models = []) => models
  .filter(Boolean)
  .map((modelItem, idx) => {
    const colors = Array.isArray(modelItem.colors) ? modelItem.colors : [];
    const normalizedColors = colors.map((colorItem, colorIdx) => {
      return {
        id: colorItem.id || colorItem.name || `color-${colorIdx + 1}`,
        name: colorItem.name || colorItem.id || `Color ${colorIdx + 1}`,
        url: getAssetUrl(colorItem.url),
      };
    });
    return {
      id: modelItem.id || modelItem.name || `model-${idx + 1}`,
      name: modelItem.name || modelItem.id || `Model ${idx + 1}`,
      url: getAssetUrl(modelItem.url) || normalizedColors[0]?.url || "",
      colors: normalizedColors,
    };
  });

const normalizeSegments = (rawSegments = []) => {
  return rawSegments
    .filter(Boolean)
    .map((segmentItem, idx) => ({
      id: segmentItem.id || segmentItem.name || `segment-${idx + 1}`,
      name: segmentItem.name || segmentItem.id || `Segment ${idx + 1}`,
      models: normalizeModels(Array.isArray(segmentItem.models) ? segmentItem.models : []),
      source: "backend",
    }));
};

const normalizeBackgrounds = (rawBackgrounds = []) => {
  return rawBackgrounds
    .filter(Boolean)
    .map((bg, idx) => ({
      id: bg.id || bg.name || `background-${idx + 1}`,
      name: bg.name || bg.id || `Background ${idx + 1}`,
      url: getAssetUrl(bg.url),
      source: "backend",
    }));
};

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LineIcon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
);

const SvgIcon = ({ icon, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(ICON_PATHS[icon] || ICON_PATHS.image).map(path => <path key={path} d={path} />)}
  </svg>
);

const SpinnerIcon = ({ size = 22, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className="spin animate-spin">
    <circle cx="11" cy="11" r="9" stroke="rgba(128,128,128,0.25)" strokeWidth="2.5"/>
    <path d="M11 2a9 9 0 0 1 9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

function Step({ n, label, done, children }) {
  return (
    <div className={`step${done ? " step-done" : ""}`}>
      <div className="step-hd">
        <div className={`step-num${done ? " done" : ""}`}>{done ? <CheckIcon /> : n}</div>
        <span className="step-lbl">{label}</span>
        {done && <span className="step-tick">✓</span>}
      </div>
      <div className="step-bd">{children}</div>
    </div>
  );
}


export {
  API_BASE,
  SEGMENTS_API_URL,
  BACKGROUNDS_API_URL,
  HISTORY_API_URL,
  PLATFORMS,
  LANGUAGES,
  OFFER_TYPES,
  NO_OFFER_ID,
  STAT_CARDS,
  HERO_PARTICLES,
  OFFER_HINTS,
  cx,
  sleep,
  getAssetUrl,
  makeAbsoluteUrl,
  formatOfferValue,
  formatHistoryTime,
  fetchJson,
  MOCK_GENERATED_IMAGE_URL,
  getSegmentIcon,
  normalizeSegments,
  normalizeBackgrounds,
  CheckIcon,
  LineIcon,
  SvgIcon,
  SpinnerIcon,
  Step,
};
