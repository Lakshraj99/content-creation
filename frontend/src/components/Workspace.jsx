import { useEffect, useState } from "react";
import {
  API_BASE,
  SEGMENTS_API_URL,
  BACKGROUNDS_API_URL,
  HISTORY_API_URL,
  PLATFORMS,
  LANGUAGES,
  OFFER_TYPES,
  NO_OFFER_ID,
  OFFER_HINTS,
  cx,
  sleep,
  getAssetUrl,
  makeAbsoluteUrl,
  formatOfferValue,
  fetchJson,
  MOCK_GENERATED_IMAGE_URL,
  getSegmentIcon,
  normalizeSegments,
  normalizeBackgrounds,
  CheckIcon,
  SvgIcon,
  SpinnerIcon,
  Step,
} from "./shared.jsx";

export default function Workspace() {
  const [segments,      setSegments]      = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [segmentError, setSegmentError] = useState(null);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(true);
  const [bgError, setBgError] = useState(null);

  const [segment,  setSegment]  = useState("");
  const [model,    setModel]    = useState(null);
  const [color,    setColor]    = useState(null);
  const [festival, setFestival] = useState(null);
  const [language, setLanguage] = useState("English");
  const [campaignHeader, setCampaignHeader] = useState("");
  
  const [selectedOfferIds,    setSelectedOfferIds]    = useState([]);
  const [offerDetails,        setOfferDetails]        = useState({}); 
  const [customOfferText,     setCustomOfferText]     = useState("");
  const [dealerAddress, setDealerAddress] = useState("");
  const [platform,       setPlatform]       = useState(null);

  const [generating,    setGenerating]    = useState(false);
  const [generated,     setGenerated]     = useState(false);
  const [result,        setResult]        = useState(null);
  const [generateError,  setGenerateError]  = useState("");
  const [generateDetail, setGenerateDetail] = useState("");
  const [exportToast,    setExportToast]    = useState("");

  const [editHeader,  setEditHeader]  = useState("");
  const [editOffers,  setEditOffers]  = useState([""]);
  const [editAddress, setEditAddress] = useState("");
  const [editing,     setEditing]     = useState(false);
  const [editError,   setEditError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setSegmentError(null);
        const { data: segsData } = await fetchJson(SEGMENTS_API_URL);
        const nextSegments = normalizeSegments(Array.isArray(segsData) ? segsData : []);
        setSegments(nextSegments);
        setSegment(nextSegments[0]?.id || "");
        setModel(null);
        setColor(null);
      } catch (err) {
        console.error(`Failed to fetch vehicle segments from ${SEGMENTS_API_URL}`, err);
        setSegmentError(err.message || "Failed to fetch");
        setSegments([]);
        setSegment("");
        setModel(null);
        setColor(null);
      } finally {
        setLoadingAssets(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        setBgError(null);
        const { data: bgData } = await fetchJson(BACKGROUNDS_API_URL);
        setBackgrounds(normalizeBackgrounds(Array.isArray(bgData) ? bgData : []));
      } catch (err) {
        console.error(`Failed to fetch backgrounds from ${BACKGROUNDS_API_URL}`, err);
        setBgError(err.message || "Failed to fetch");
        setBackgrounds([]);
        setFestival(null);
      } finally {
        setLoadingBackgrounds(false);
      }
    };
    loadBackgrounds();
  }, []);

  const currentSegmentObj = segments.find(s => s.id === segment) || null;
  const currentModels     = currentSegmentObj ? currentSegmentObj.models || [] : [];
  const currentModelObj   = currentModels.find(m => m.id === model) || null;
  const currentColors     = currentModelObj ? currentModelObj.colors || [] : [];
  const selectedBackgroundObj = backgrounds.find(bg => bg.name === festival || bg.id === festival) || null;
  const canGenerate       = !!(model && color && festival && platform) && !generating;
  const noOfferSelected   = selectedOfferIds.length === 0;

  const computeOfferText = (id) => {
    const type   = OFFER_TYPES.find(o => o.id === id);
    if (!type) return "";
    const detail = offerDetails[id] || {};
    const valueType = detail.valueType || type.typeOptions[0];
    const value = formatOfferValue(detail.amount);
    return value ? `${type.label}\n${valueType} ${value}` : type.label;
  };

  const totalOfferSlots  = selectedOfferIds.length;
  const finalOfferTexts  = selectedOfferIds
    .map(id => computeOfferText(id))
    .slice(0, 3)
    .filter(Boolean);

  const handleSegment = (s) => { setSegment(s); setModel(null); setColor(null); };
  const handleModel   = (m) => { setModel(m); setColor(null); };
  const handleLanguageChange = (val) => { setLanguage(val); };

  const toggleOffer = (id) => {
    setSelectedOfferIds(prev => {
      if (id === NO_OFFER_ID) {
        setCustomOfferText("");
        setOfferDetails({});
        return [];
      }
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const updateOfferDetail = (id, field, val) => {
    setOfferDetails(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const res  = await fetch(getAssetUrl(result.url));
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {}
  };

  const campaignName = `${selectedBackgroundObj?.name || festival || "Campaign"} ${currentModelObj?.name || model || "Poster"}`.trim();

  const saveHistoryItem = async (poster) => {
    if (!poster?.url) return;
    try {
      await fetch(HISTORY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: poster.filename || poster.base_filename || `poster-${Date.now()}.png`,
          url: poster.url,
          campaign: campaignName,
          background: selectedBackgroundObj?.name || festival || "Uncategorized",
          timestamp: new Date().toISOString(),
          tags: [],
        }),
      });
    } catch (_) {}
  };

  const applyMockGeneration = async (detail = "") => {
    await sleep(900);
    const mockFilename = `mock-${Date.now()}.png`;
    setResult({
      filename: mockFilename,
      url: MOCK_GENERATED_IMAGE_URL,
      base_filename: mockFilename,
      prompt_used: "Mock mode poster preview",
      translated_offers: finalOfferTexts,
    });
    setGenerated(true);
    setEditHeader("");
    setEditOffers(finalOfferTexts.length > 0 ? finalOfferTexts : [""]);
    setEditAddress(dealerAddress);
    setGenerateError("Mock Mode: Generation simulated (Backend unreachable)");
    setGenerateDetail(detail);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerated(false);
    setResult(null);
    setGenerateError("");
    setGenerateDetail("");
    setExportToast("");
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/api/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bike_id:         model,
          bike_name:       model,
          color_id:        color.id,
          color_name:      color.name,
          festival:        festival,
          campaign_header: "",
          offers:          finalOfferTexts.length > 0 ? finalOfferTexts : [], // Empty array removes the offer strip.
          dealer_address:  dealerAddress,
          platform_name:   platform.name,
          platform_width:  platform.width,
          platform_height: platform.height,
          language:        language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await applyMockGeneration(data.detail || "Generation endpoint returned an error.");
      } else {
        setResult(data);
        setGenerated(true);
        setEditHeader("");
        
        // ── FIXED: Uses the translated strings returned from the backend directly in the edit boxes
        if (data.translated_offers && data.translated_offers.length > 0) {
            setEditOffers(data.translated_offers);
        } else {
            setEditOffers(finalOfferTexts.length > 0 ? finalOfferTexts : [""]);
        }
        setEditAddress(dealerAddress);
        await saveHistoryItem(data);
      }
    } catch (err) {
      await applyMockGeneration(err.message || "Backend unreachable.");
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!result?.base_filename || editing) return;
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`${API_BASE}/api/edit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_filename:   result.base_filename,
          campaign_header: "",
          offers:          editOffers.filter(o => o.trim()),
          dealer_address:  editAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.detail || "Could not apply changes");
      } else {
        setResult(prev => ({ ...prev, filename: data.filename, url: data.url }));
      }
    } catch (err) {
      setEditError(err.message || "Could not apply changes");
    } finally {
      setEditing(false);
    }
  };

  const shareImageUrl = result ? makeAbsoluteUrl(result.url) : "";
  const encodedShareImageUrl = encodeURIComponent(shareImageUrl);

  const handleInstagramCopy = async () => {
    if (!shareImageUrl) return;
    try {
      await navigator.clipboard.writeText(shareImageUrl);
      setExportToast("Instagram: image URL copied to clipboard.");
    } catch (_) {
      setExportToast("Instagram export ready: copy the generated image URL from the preview.");
    }
  };

  const previewImage = result ? getAssetUrl(result.url) : getAssetUrl(color?.url || currentModelObj?.url || "");
  const previewTitle = platform?.name === "Poster" ? "Poster" : platform ? `${platform.name} Poster` : "Creative Preview";
  const missingRequirement = !model
    ? "Select a vehicle model"
    : !color
    ? "Choose a color"
    : !festival
    ? "Pick a background"
    : !platform
    ? "Choose a platform"
    : "";

  return (
    <div className="workspace-shell">
      <section className="workspace-left">
        <div className="panel-title-block">
          <p className="eyebrow">Image Generation</p>
          <h2>Campaign Configuration</h2>
        </div>

        <Step n={1} label="Vehicle Category" done={!!model && !!color}>
          {loadingAssets ? (
            <div className="loading-row"><SpinnerIcon size={16} color="var(--acc)" /> Loading models...</div>
          ) : segmentError ? (
            <div className="asset-error-box">Error Fetching Vehicles: {segmentError}. Make sure the backend is running at the configured VITE_API_BASE_URL.</div>
          ) : segments.length === 0 ? (
            <p className="hint">Backend reached successfully, but 0 segments were returned. Check your assets folder structure.</p>
          ) : (
            <>
              <div className="vehicle-tabs" role="tablist" aria-label="Vehicle category">
                {segments.map(segmentOption => {
                  const isActive = segment === segmentOption.id;
                  return (
                    <button
                      key={segmentOption.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={cx("vehicle-tab", isActive && "on")}
                      onClick={() => handleSegment(segmentOption.id)}
                    >
                      <span className="vehicle-tab-icon"><SvgIcon icon={getSegmentIcon(segmentOption.name)} size={16} /></span>
                      <span>{segmentOption.name}</span>
                      <small>{segmentOption.models?.length || 0}</small>
                    </button>
                  );
                })}
              </div>

              <div className="vehicle-section-head">
                <div>
                  <span className="vehicle-kicker">Selected segment</span>
                  <h3>{currentSegmentObj?.name || "Vehicle"}</h3>
                </div>
              </div>

              {currentModels.length === 0 ? (
                <p className="hint">No models currently available in this segment.</p>
              ) : (
                <div className="model-grid">
                  {currentModels.map(m => (
                    <button key={m.id} type="button" className={cx("model-card", model === m.id && "sel")} onClick={() => handleModel(m.id)}>
                      <div className="model-thumb">
                        {m.url ? (
                          <img
                            src={getAssetUrl(m.url)}
                            alt={m.name}
                            className="thumb-img"
                            onError={e => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <span className="asset-empty">No image</span>
                        )}
                      </div>
                      <span className="model-nm">{m.name}</span>
                      {model === m.id && <div className="chk-badge"><CheckIcon /></div>}
                    </button>
                  ))}
                </div>
              )}
              {!model ? (
                <p className="hint">Select a {currentSegmentObj?.name || "vehicle"} model to reveal colorways.</p>
              ) : currentColors.length === 0 ? (
                <p className="hint">No color images found for this model.</p>
              ) : (
                <div className="color-grid compact-colors">
                  {currentColors.map(c => (
                    <button key={c.id} type="button" className={cx("color-card", color?.id === c.id && "sel")} onClick={() => setColor(c)}>
                      <div className="color-swatch">
                        {c.url ? (
                          <img
                            src={getAssetUrl(c.url)}
                            alt={c.name}
                            className="swatch-img"
                            onError={e => {
                              e.currentTarget.parentElement.style.background = "var(--surface-3)";
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="asset-empty">No image</span>
                        )}
                      </div>
                      <span className="color-nm">{c.name}</span>
                      {color?.id === c.id && <div className="chk-badge"><CheckIcon /></div>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </Step>

        <Step n={2} label="Background" done={!!festival}>
          {loadingBackgrounds ? (
            <div className="loading-row"><SpinnerIcon size={16} color="var(--acc)" /> Loading backgrounds...</div>
          ) : bgError ? (
            <div className="asset-error-box">Error Fetching Backgrounds: {bgError}. Make sure the backend is running at the configured VITE_API_BASE_URL.</div>
          ) : backgrounds.length === 0 ? (
            <p className="hint">Backend reached successfully, but 0 backgrounds were returned. Check your assets folder structure.</p>
          ) : (
            <div className="background-grid">
              {backgrounds.map(bg => (
                <button key={bg.id} type="button" className={cx("background-card", (festival === bg.name || festival === bg.id) && "sel")} onClick={() => setFestival(bg.name)}>
                  <div className="background-thumb">
                    {bg.url ? (
                      <img
                        src={getAssetUrl(bg.url)}
                        alt={bg.name}
                        className="background-img"
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <span className="asset-empty">No image</span>
                    )}
                  </div>
                  <span className="background-name">{bg.name}</span>
                  {(festival === bg.name || festival === bg.id) && <div className="chk-badge"><CheckIcon /></div>}
                </button>
              ))}
            </div>
          )}
        </Step>

        <Step n={3} label="Language" done>
          <div className="pill-grid lang-pill-grid">
            {LANGUAGES.map(l => (
              <button key={l} type="button" className={cx("pill-btn", language === l && "pill-on")} onClick={() => handleLanguageChange(l)}>{l}</button>
            ))}
          </div>
        </Step>

        <Step n={4} label="Platform Selection" done={!!platform}>
          <div className="plat-grid">
            {PLATFORMS.map(p => (
              <button key={p.name} type="button" className={cx("plat-card", platform?.name === p.name && "sel")} onClick={() => setPlatform(p)}>
                <span className={cx("plat-icon", `plat-icon-${p.icon}`)}><SvgIcon icon={p.icon} size={21} /></span>
                <span className="plat-name">{p.name}</span>
                <span className="plat-dim">{p.ratio} · {p.width}×{p.height}</span>
                {platform?.name === p.name && <div className="chk-badge"><CheckIcon /></div>}
              </button>
            ))}
          </div>
        </Step>

        <Step n={5} label="Offer Configuration" done={noOfferSelected || finalOfferTexts.length > 0}>
          <div className="offer-section-hd">
            <span>Offer slots</span>
            <span className="offer-count">{noOfferSelected ? "None" : `${totalOfferSlots}/3`}</span>
          </div>
          <div className="offer-card-grid">
            <div className={cx("offer-card no-offer-card", noOfferSelected && "offer-card-on")}>
              <button type="button" className="offer-card-top" onClick={() => toggleOffer(NO_OFFER_ID)}>
                <span>No Offer</span>
                <span className="offer-toggle">{noOfferSelected ? <CheckIcon /> : "+"}</span>
              </button>
              <p className="no-offer-copy">Generate a clean campaign creative without offer ribbons.</p>
              {noOfferSelected && <div className="chk-badge"><CheckIcon /></div>}
            </div>

            {OFFER_TYPES.map(ot => {
              const checked  = selectedOfferIds.includes(ot.id);
              const detail   = offerDetails[ot.id] || {};
              const disabled = !checked && !noOfferSelected && totalOfferSlots >= 3;
              const valueType = detail.valueType || ot.typeOptions[0];
              return (
                <div key={ot.id} className={cx("offer-card", checked && "offer-card-on", disabled && "offer-card-disabled")}>
                  <button type="button" className="offer-card-top" disabled={disabled} onClick={() => toggleOffer(ot.id)}>
                    <span>{ot.label}</span>
                    <span className="offer-toggle">{checked ? <CheckIcon /> : "+"}</span>
                  </button>
                  {checked && <div className="chk-badge"><CheckIcon /></div>}
                  {checked && (
                    <div className="offer-card-body">
                      <div className="offer-input-grid">
                        <label className="compact-field">
                          <span>Type</span>
                          <select className="offer-select" value={valueType} onChange={e => updateOfferDetail(ot.id, "valueType", e.target.value)}>
                            {ot.typeOptions.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                          </select>
                        </label>
                        <label className="compact-field value-field">
                          <span>Value</span>
                          <input
                            type="text"
                            className="offer-value-inp"
                            placeholder={OFFER_HINTS[ot.id] || "₹5000"}
                            value={detail.amount || ""}
                            onChange={e => updateOfferDetail(ot.id, "amount", e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Step>

        <Step n={6} label="Dealer Address" done={dealerAddress.trim() !== ""}>
          <div className="field-stack">
            <label className="floating-field">
              <textarea className="text-control" rows={3} placeholder=" " value={dealerAddress} onChange={e => setDealerAddress(e.target.value)} />
              <span>Dealer Address</span>
            </label>
          </div>
        </Step>

      </section>

      <aside className="workspace-right sticky top-24 self-start">
        <div className="right-sticky">
          <div className="preview-card">
            <div className="preview-head">
              <div>
                <p className="eyebrow">Live Preview</p>
                <h2>{previewTitle}</h2>
              </div>
              <span className="preview-size">{platform ? `${platform.width}×${platform.height}` : "Auto"}</span>
            </div>

            <div className="preview-stage">
              <div className="preview-frame relative w-full h-[400px] md:h-[500px] bg-slate-100 rounded-xl flex items-center justify-center p-4 overflow-hidden border border-slate-200">
                {generating ? (
                  <div className="output-loading">
                    <div className="ai-loader-orb"><SpinnerIcon size={28} /></div>
                    <strong>AI is designing your poster...</strong>
                    <span>Composing vehicle, offers, format, and brand-safe text layers.</span>
                    <div className="poster-skeleton">
                      <div className="sk-line wide" />
                      <div className="sk-bike" />
                      <div className="sk-line" />
                      <div className="sk-line short" />
                    </div>
                  </div>
                ) : result ? (
                  <img src={previewImage} alt="Generated poster" className="poster-img max-w-full max-h-full object-contain rounded-md shadow-md" />
                ) : (
                  <div
                    className={cx("mock-poster", selectedBackgroundObj && "with-bg")}
                    style={selectedBackgroundObj?.url ? { backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.38), rgba(2, 6, 23, 0.84)), url(${getAssetUrl(selectedBackgroundObj.url)})` } : undefined}
                  >
                    <div className="mock-bike">
                      {previewImage ? <img src={previewImage} alt={color?.name || currentModelObj?.name || "Vehicle preview"} /> : <span>Hero Studio</span>}
                    </div>
                    <div className="mock-offers">
                      {(finalOfferTexts.length ? finalOfferTexts : ["Offer text"]).map((txt, idx) => (
                        <span key={`${txt}-${idx}`}>{txt.replace(/\n/g, " ")}</span>
                      ))}
                    </div>
                    <div className="mock-footer">{dealerAddress || "Dealer Address"}</div>
                  </div>
                )}
              </div>
            </div>

            {generateError && (
              <div className={cx("gen-error", generateError.startsWith("Mock Mode") && "mock-mode")}>
                <div>{generateError}</div>
                {generateDetail && <div className="gen-error-detail">{generateDetail}</div>}
              </div>
            )}

            <div className="action-row">
              <button className="btn-gen" type="button" onClick={handleGenerate} disabled={!canGenerate}>
                {generating ? <><SpinnerIcon size={18} /> Generating...</> : "Generate Poster"}
              </button>
              <button className="btn-download" type="button" onClick={handleDownload} disabled={!result}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>

            <div className="export-panel">
              <div className="export-title">Export To</div>
              <div className="export-row">
                <button className="export-btn export-instagram" type="button" onClick={handleInstagramCopy} disabled={!result}>
                  <SvgIcon icon="instagram" size={17} /> Instagram
                </button>
                <a
                  className={cx("export-btn export-whatsapp", !result && "disabled")}
                  href={result ? `https://wa.me/?text=${encodedShareImageUrl}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!result}
                  onClick={e => { if (!result) e.preventDefault(); }}
                >
                  <SvgIcon icon="whatsapp" size={17} /> WhatsApp
                </a>
                <a
                  className={cx("export-btn export-facebook", !result && "disabled")}
                  href={result ? `https://www.facebook.com/sharer/sharer.php?u=${encodedShareImageUrl}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!result}
                  onClick={e => { if (!result) e.preventDefault(); }}
                >
                  <SvgIcon icon="facebook" size={17} /> Facebook
                </a>
              </div>
              {exportToast && <div className="export-toast">{exportToast}</div>}
            </div>

            {!canGenerate && !generating && <p className="gen-hint">{missingRequirement}</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
