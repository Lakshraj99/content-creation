import { useEffect, useState } from "react";
import { API_BASE, CheckIcon, SpinnerIcon } from "./shared.jsx";

const DEFAULT_GUIDELINES = { brand_name: "", guidelines: "", negative_prompt: "", apply_to_image: true, apply_to_video: false };

export default function BrandGuidelines() {
  const [form, setForm] = useState(DEFAULT_GUIDELINES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadGuidelines = async () => {
      setLoading(true); setError("");
      try {
        const res = await fetch(`${API_BASE}/api/guidelines/`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Unable to load guidelines");
        if (!cancelled) setForm({ ...DEFAULT_GUIDELINES, ...data });
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load guidelines");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGuidelines();
    return () => { cancelled = true; };
  }, []);

  const updateField = (field, value) => { setStatus(""); setError(""); setForm(prev => ({ ...prev, [field]: value })); };

  const handleSave = async () => {
    setSaving(true); setStatus(""); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/guidelines/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unable to save guidelines");
      setForm({ ...DEFAULT_GUIDELINES, ...data });
      setStatus("Guidelines saved.");
    } catch (err) { setError(err.message || "Unable to save guidelines"); } finally { setSaving(false); }
  };

  return (
    <div className="settings-page">
      <section className="settings-panel">
        <div className="settings-head">
          <div><div className="settings-kicker">BRAND CONTROL</div><h1 className="settings-title">Brand Guidelines</h1></div>
        </div>

        {loading ? (
          <div className="settings-loading"><SpinnerIcon size={16} color="var(--acc)" /> Loading guidelines...</div>
        ) : (
          <div className="settings-form">
            <label className="field"><span className="field-label">Brand Name</span><input className="settings-input" value={form.brand_name} onChange={e => updateField("brand_name", e.target.value)} placeholder="Hero MotoCorp" /></label>
            <label className="field"><span className="field-label">Guidelines</span><textarea className="settings-textarea" rows={8} value={form.guidelines} onChange={e => updateField("guidelines", e.target.value)} placeholder="Use official brand colors..." /></label>
            <label className="field"><span className="field-label">Negative Prompt</span><textarea className="settings-textarea" rows={5} value={form.negative_prompt} onChange={e => updateField("negative_prompt", e.target.value)} placeholder="Avoid distorted logos..." /></label>
            <div className="apply-box">
              <div className="field-label">Apply guideline to</div>
              <div className="apply-options">
                <label className={`apply-option${form.apply_to_image ? " on" : ""}`}><input type="checkbox" checked={form.apply_to_image} onChange={e => updateField("apply_to_image", e.target.checked)} /><span className="apply-check">{form.apply_to_image && <CheckIcon />}</span><span>Image Generation</span></label>
                <label className={`apply-option${form.apply_to_video ? " on" : ""}`}><input type="checkbox" checked={form.apply_to_video} onChange={e => updateField("apply_to_video", e.target.checked)} /><span className="apply-check">{form.apply_to_video && <CheckIcon />}</span><span>Video Generation</span></label>
              </div>
            </div>
            <div className="settings-actions">
              <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? <><SpinnerIcon size={16} /> Saving...</> : "Save Guidelines"}</button>
              {status && <span className="save-status">{status}</span>}
              {error && <span className="save-error">{error}</span>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

