"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./admin-types";
import { useToast } from "./toast-provider";

type Settings = { siteTitle: string; tagline: string; biography: string; profileImage: string; email: string; instagram: string; facebook: string; youtube: string; linkedin: string };
const initial: Settings = { siteTitle: "Nahid Estes", tagline: "Developer · Photographer · Visual Storyteller", biography: "", profileImage: "", email: "", instagram: "", facebook: "", youtube: "", linkedin: "" };

export function SettingsPanel() {
  const { notify } = useToast();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const result = await apiRequest<(Record<string, unknown> & { socialLinks?: Record<string, string> })[]>("/api/admin/settings");
    if (!result.ok) { notify(result.error.message, "error"); return; }
    const item = result.data[0];
    if (item) setSettings({ ...initial, ...item, ...item.socialLinks } as Settings);
  }, [notify]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const update = (key: keyof Settings, value: string) => setSettings((current) => ({ ...current, [key]: value }));
  return <><div className="admin-top"><h1>Site Settings</h1><Link className="text-link" href="/about" target="_blank">Preview About</Link></div><form className="admin-panel admin-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const payload = { siteTitle: settings.siteTitle, tagline: settings.tagline, biography: settings.biography, profileImage: settings.profileImage, email: settings.email, socialLinks: { instagram: settings.instagram, facebook: settings.facebook, youtube: settings.youtube, linkedin: settings.linkedin } }; const result = await apiRequest("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); setBusy(false); notify(result.ok ? "Settings saved." : result.error.message, result.ok ? "success" : "error"); }}><div className="field-grid"><div className="field"><label>Site title</label><input value={settings.siteTitle} onChange={(event) => update("siteTitle", event.target.value)}/></div><div className="field"><label>Tagline</label><input value={settings.tagline} onChange={(event) => update("tagline", event.target.value)}/></div></div><div className="field"><label>Biography</label><textarea value={settings.biography} onChange={(event) => update("biography", event.target.value)}/></div><div className="field-grid"><div className="field"><label>Profile image HTTPS URL</label><input type="url" value={settings.profileImage} onChange={(event) => update("profileImage", event.target.value)}/><small>Direct uploads are temporarily disabled.</small></div><div className="field"><label>Contact email</label><input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)}/></div></div><div className="field-grid">{(["instagram", "facebook", "youtube", "linkedin"] as const).map((network) => <div className="field" key={network}><label>{network}</label><input type="url" value={settings[network]} onChange={(event) => update(network, event.target.value)}/></div>)}</div><button className="button dark" disabled={busy}>{busy ? "Saving…" : "Save Settings →"}</button></form></>;
}
