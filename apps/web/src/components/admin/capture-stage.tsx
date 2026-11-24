"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  List,
  MessageSquarePlus,
  RefreshCw,
  Square,
  Tag,
  X,
} from "lucide-react";
import { CLIP_QUICK_TAGS } from "@/components/admin/clip-annotations";
import { ClipReviewModal } from "@/components/admin/clip-review-modal";
import {
  FLOW_LABELS,
  type CoverageStep,
} from "@/lib/admin/coverage-pack";
import type {
  CaptureAnnotation,
  CaptureSession,
  Operator,
  RecordingArtifact,
} from "@/lib/admin/types";
import { viewportForPlatform } from "@/lib/admin/viewport-presets";
import { cn } from "@/lib/utils";

const QUICK_TAGS = CLIP_QUICK_TAGS;

type Props = {
  initialSession: CaptureSession;
  operator: Operator;
  coverageSteps: CoverageStep[];
};

type RecState = "idle" | "countdown" | "recording" | "uploading";

export function CaptureStage({
  initialSession,
  operator,
  coverageSteps,
}: Props) {
  const [session, setSession] = useState(initialSession);
  const [recState, setRecState] = useState<RecState>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [lastClip, setLastClip] = useState<RecordingArtifact | null>(null);
  const [reviewClipId, setReviewClipId] = useState<string | null>(null);
  const [siteOpen, setSiteOpen] = useState(false);
  const [shareLive, setShareLive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const maxClipRef = useRef(12);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posterRef = useRef<string | undefined>(undefined);
  const siteWinRef = useRef<Window | null>(null);
  const intentionalStopRef = useRef(false);
  const pendingLoadReloadRef = useRef(false);
  const finishingRef = useRef(false);

  function streamIsLive(stream: MediaStream | null | undefined) {
    return Boolean(
      stream?.getVideoTracks().some((t) => t.readyState === "live"),
    );
  }

  function releaseShare() {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    setShareLive(false);
  }

  const currentStepId =
    session.guide?.currentStepId ??
    session.items.find((i) => i.status === "todo")?.playbookItemId ??
    coverageSteps[0]?.id;

  const step =
    coverageSteps.find((s) => s.id === currentStepId) ?? coverageSteps[0];
  const stepIndex = coverageSteps.findIndex((s) => s.id === step?.id);
  /** Required journey path first — optional UI tags don't block Next. */
  const primarySteps = useMemo(
    () => coverageSteps.filter((s) => s.required),
    [coverageSteps],
  );
  const primaryIndex = primarySteps.findIndex((s) => s.id === step?.id);
  const journeyMeta = step?.flowId ? FLOW_LABELS[step.flowId] : undefined;
  const artifacts = session.artifacts ?? [];

  const liveTags: CaptureAnnotation[] = useMemo(() => {
    if (!step?.id) return [];
    return session.liveAnnotations?.[step.id] ?? [];
  }, [session.liveAnnotations, step?.id]);

  const refreshSession = useCallback(async () => {
    const res = await fetch(`/api/admin/sessions/${session.id}`);
    const data = await res.json();
    if (data.session) setSession(data.session as CaptureSession);
    return data.session as CaptureSession | undefined;
  }, [session.id]);

  useEffect(() => {
    const t = setInterval(() => {
      void refreshSession();
    }, 3000);
    return () => clearInterval(t);
  }, [refreshSession]);

  const viewport = viewportForPlatform(session.platform);

  const openSite = useCallback(() => {
    const win = window.open(
      operator.url,
      `blaast-site-${session.id}`,
      viewport.windowFeatures,
    );
    if (!win) {
      toast.error("Popup blocked — allow popups for this site");
      return;
    }
    siteWinRef.current = win;
    setSiteOpen(true);
    try {
      win.focus();
    } catch {
      /* ignore */
    }
    toast.message(
      `${viewport.label} window · ${viewport.width}×${viewport.height}`,
    );
  }, [operator.url, session.id, viewport]);

  /** Reload operator page without touching this control window (keeps MediaRecorder alive). */
  const reloadSite = useCallback(() => {
    const win = siteWinRef.current;
    if (!win || win.closed) {
      openSite();
      toast.message("Site reopened — share that Window again if recording stopped");
      return;
    }
    try {
      win.location.href = operator.url;
      toast.message("Reloading site — loading screen should be in the clip");
      try {
        win.focus();
      } catch {
        /* ignore */
      }
    } catch {
      // Cross-origin after first nav — reopen
      openSite();
      toast.message("Reopened site (couldn’t reload in place)");
    }
  }, [openSite, operator.url]);

  // Operators block iframes — open the real site beside this control dock
  useEffect(() => {
    const t = setTimeout(() => openSite(), 300);
    return () => clearTimeout(t);
  }, [openSite]);

  useEffect(() => {
    const t = setInterval(() => {
      if (siteWinRef.current?.closed) {
        siteWinRef.current = null;
        setSiteOpen(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (recState !== "recording" || !startedAtRef.current) {
      setElapsedSec(0);
      return;
    }
    const tick = () =>
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - startedAtRef.current!) / 1000)),
      );
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [recState]);

  const patchGuide = useCallback(
    async (guide: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSession(data.session);
    },
    [session.id],
  );

  const addAnnotation = useCallback(
    async (input: { label: string; tag: string; comment?: string }) => {
      if (!step?.id) return;
      const atMs =
        recState === "recording" && startedAtRef.current
          ? Date.now() - startedAtRef.current
          : undefined;
      const res = await fetch(`/api/admin/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverageStepId: step.id,
          annotation: { ...input, atMs },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Tag failed");
        return;
      }
      setSession(data.session);
      toast.success(`Tagged: ${input.label}`);
    },
    [session.id, step?.id, recState],
  );

  async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function capturePoster(): Promise<string | undefined> {
    try {
      const video = document.createElement("video");
      video.muted = true;
      video.srcObject = streamRef.current;
      await video.play();
      await new Promise((r) => setTimeout(r, 100));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      return dataUrl.split(",")[1];
    } catch {
      return undefined;
    }
  }

  async function beginRecording(opts?: { reloadForLoad?: boolean }) {
    if (!step) return;
    intentionalStopRef.current = false;
    finishingRef.current = false;
    pendingLoadReloadRef.current = Boolean(opts?.reloadForLoad);
    try {
      if (!siteWinRef.current || siteWinRef.current.closed) {
        openSite();
        // Give the site window a beat to open before the share picker
        await new Promise((r) => setTimeout(r, 400));
      } else {
        try {
          siteWinRef.current.focus();
        } catch {
          /* ignore */
        }
      }

      let stream = streamRef.current;
      const reusing = streamIsLive(stream);
      if (!reusing) {
        // Prefer sharing the site *Window* — Chrome Tab share often dies on refresh.
        // Browser security still requires one picker click; we keep that share for later clips.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CaptureControllerCtor = (window as any).CaptureController as
          | (new () => { setFocusBehavior: (b: string) => void })
          | undefined;
        let controller: { setFocusBehavior: (b: string) => void } | undefined;
        if (typeof CaptureControllerCtor === "function") {
          controller = new CaptureControllerCtor();
          try {
            controller.setFocusBehavior("focus-captured-surface");
          } catch {
            /* ignore */
          }
        }

        const displayOpts = {
          video: { displaySurface: "window" },
          audio: false,
          preferCurrentTab: false,
          selfBrowserSurface: "exclude",
          surfaceSwitching: "include",
          monitorTypeSurfaces: "exclude",
          ...(controller ? { controller } : {}),
        } as DisplayMediaStreamOptions;

        stream = await navigator.mediaDevices.getDisplayMedia(displayOpts);
        streamRef.current = stream;
        setShareLive(true);

        const surface = stream.getVideoTracks()[0]?.getSettings?.().displaySurface;
        if (surface === "browser") {
          toast.message(
            "Shared a Chrome tab — use Reload site here if refresh kills the share. Prefer Window next time.",
            { duration: 5000 },
          );
        } else {
          toast.message(
            "Window locked in — next clips reuse this share (no picker).",
            { duration: 4000 },
          );
        }

        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          setShareLive(false);
          streamRef.current = null;
          if (intentionalStopRef.current || finishingRef.current) return;
          toast.error(
            "Share ended. Start recording again and pick the site window once.",
          );
          if (mediaRecorderRef.current?.state === "recording") {
            void finishRecording();
          }
        });
      }

      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream!, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void uploadRecording();
      };

      // You stop when the task is done — no short auto-cut.
      maxClipRef.current = 600; // 10 min absolute safety only
      startedAtRef.current = Date.now();
      recorder.start(250);
      setRecState("recording");
      await patchGuide({
        currentStepId: step.id,
        phase: "recording",
        recordingStartedAt: new Date().toISOString(),
        maxClipSec: maxClipRef.current,
      });
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        toast.message("10 min safety limit — stopping");
        void finishRecording();
      }, maxClipRef.current * 1000);

      if (pendingLoadReloadRef.current) {
        pendingLoadReloadRef.current = false;
        setTimeout(() => reloadSite(), 500);
        toast.message(
          "Recording — site reloading for loader. Hit Stop when home looks done.",
        );
      } else if (reusing) {
        toast.message("Recording (same window). Hit Stop when done.");
      } else {
        toast.message(
          "Recording until Stop. Next beat keeps this window — no re-select.",
        );
      }
    } catch (err) {
      if (!streamIsLive(streamRef.current)) releaseShare();
      setRecState("idle");
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not start — share the operator Window when Chrome asks",
      );
      await patchGuide({
        currentStepId: step.id,
        phase: "idle",
        recordingStartedAt: null,
      });
    }
  }

  async function finishRecording() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    intentionalStopRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") {
      setRecState("uploading");
      posterRef.current = await capturePoster();
      // Stop recorder only — keep the display share for the next beat
      mediaRecorderRef.current.stop();
    } else {
      setRecState("idle");
      finishingRef.current = false;
    }
  }

  async function putSignedUpload(
    signedUrl: string,
    token: string,
    blob: Blob,
    contentType: string,
  ) {
    const res = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${token}`,
        "x-upsert": "true",
      },
      body: blob,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Storage upload failed (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`,
      );
    }
  }

  async function readJsonSafe(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Server returned non-JSON (${res.status}): ${text.slice(0, 120) || "empty"}`,
      );
    }
  }

  async function uploadRecording() {
    if (!step) {
      finishingRef.current = false;
      setRecState("idle");
      return;
    }
    setRecState("uploading");
    try {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (blob.size < 2000) {
        throw new Error(
          "Empty recording — share the site Window (not this remote), then Record → Stop",
        );
      }
      const durationMs = startedAtRef.current
        ? Date.now() - startedAtRef.current
        : undefined;
      const posterDataUrl = posterRef.current;
      posterRef.current = undefined;

      const prepRes = await fetch(
        `/api/admin/sessions/${session.id}/artifact-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coverageStepId: step.id,
            hasPoster: Boolean(posterDataUrl),
          }),
        },
      );
      const prep = (await readJsonSafe(prepRes)) as {
        error?: string;
        artifactId?: string;
        videoPath?: string;
        videoUploadUrl?: string;
        videoToken?: string;
      };

      let registerBody: Record<string, unknown>;
      if (
        prepRes.ok &&
        prep.artifactId &&
        prep.videoUploadUrl &&
        prep.videoToken &&
        prep.videoPath
      ) {
        await putSignedUpload(
          prep.videoUploadUrl,
          prep.videoToken,
          blob,
          "video/webm",
        );
        registerBody = {
          coverageStepId: step.id,
          kind: "clip",
          artifactId: prep.artifactId,
          videoPath: prep.videoPath,
          pageUrl: operator.url,
          pageTitle: operator.name,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            devicePixelRatio: viewport.devicePixelRatio,
          },
          durationMs,
          videoMime: "video/webm",
          posterBase64: posterDataUrl,
          posterMime: "image/png",
          sensitiveFlags: [],
        };
      } else {
        // Fallback for local/dev when signed upload is unavailable
        if (blob.size > 3_500_000) {
          throw new Error(
            prep.error ||
              "Clip too large for fallback upload — check Supabase keys on Vercel",
          );
        }
        const videoBase64 = await blobToBase64(blob);
        registerBody = {
          coverageStepId: step.id,
          kind: "clip",
          pageUrl: operator.url,
          pageTitle: operator.name,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            devicePixelRatio: viewport.devicePixelRatio,
          },
          durationMs,
          videoBase64,
          videoMime: "video/webm",
          posterBase64: posterDataUrl,
          posterMime: "image/png",
          sensitiveFlags: [],
        };
      }

      const res = await fetch(`/api/admin/sessions/${session.id}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerBody),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(String(data.error || "Upload failed"));

      const art = data.artifact as RecordingArtifact;
      if (!art?.id) throw new Error("Upload returned no artifact");
      setLastClip(art);
      setSession(data.session as CaptureSession);
      setReviewClipId(art.id);
      toast.success(
        streamIsLive(streamRef.current)
          ? "Clip saved — next Record reuses this window"
          : "Clip saved — open it to tag sections",
      );
      await patchGuide({
        currentStepId:
          (data.session as CaptureSession).guide?.currentStepId ?? step.id,
        phase: "idle",
        recordingStartedAt: null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      await patchGuide({
        currentStepId: step?.id,
        phase: "idle",
        recordingStartedAt: null,
      });
    } finally {
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      startedAtRef.current = null;
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setShareLive(streamIsLive(streamRef.current));
      finishingRef.current = false;
      setRecState("idle");
    }
  }

  // Drop the share when the stage window closes
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const countdownModeRef = useRef<"normal" | "page_load">("normal");

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      void beginRecording({
        reloadForLoad: countdownModeRef.current === "page_load",
      });
      return;
    }
    const t = setTimeout(
      () => setCountdown((c) => (c === null ? null : c - 1)),
      1000,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  async function startCountdown(mode: "normal" | "page_load" = "normal") {
    if (!step || recState !== "idle") return;
    countdownModeRef.current = mode;
    setRecState("countdown");
    const sec = step.countdownSec ?? 3;
    await patchGuide({
      currentStepId: step.id,
      phase: "countdown",
      countdownEndsAt: new Date(Date.now() + sec * 1000).toISOString(),
      maxClipSec: 600,
    });
    setCountdown(sec);
  }

  async function submitComment() {
    const text = commentText.trim();
    if (!text) return;
    await addAnnotation({
      label: "Comment",
      tag: "comment",
      comment: text,
    });
    setCommentText("");
    setCommentOpen(false);
  }

  async function goToStep(id: string) {
    if (recording || busy) return;
    const res = await fetch(`/api/admin/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guide: { currentStepId: id, phase: "idle" },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession(data.session);
      setStepsOpen(false);
      const art = (data.session as CaptureSession).artifacts?.find(
        (a) => a.coverageStepId === id,
      );
      setLastClip(art ?? null);
    }
  }

  async function goPrev() {
    if (primaryIndex > 0) {
      const prev = primarySteps[primaryIndex - 1];
      if (prev) await goToStep(prev.id);
      return;
    }
    const prev = coverageSteps[stepIndex - 1];
    if (prev) await goToStep(prev.id);
  }

  async function goNext() {
    // Prefer next required journey step; fall back to any following beat
    if (primaryIndex >= 0 && primaryIndex < primarySteps.length - 1) {
      const next = primarySteps[primaryIndex + 1];
      if (next) await goToStep(next.id);
      return;
    }
    const next = coverageSteps[stepIndex + 1];
    if (next) await goToStep(next.id);
  }

  async function deleteClip(clip: RecordingArtifact) {
    if (!confirm("Delete this clip?")) return;
    const res = await fetch(
      `/api/admin/sessions/${session.id}/artifacts/${clip.id}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    setSession(data.session);
    if (lastClip?.id === clip.id) setLastClip(null);
    if (reviewClipId === clip.id) setReviewClipId(null);
    toast.success("Clip deleted — stay on this step to re-record");
  }

  const reviewClip =
    artifacts.find((a) => a.id === reviewClipId) ??
    (reviewClipId && lastClip?.id === reviewClipId ? lastClip : null);

  const recording = recState === "recording";
  const busy = recState === "countdown" || recState === "uploading";

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">
      {/* Blaast controls — live on top of the site window */}
      <header
        className={cn(
          "relative z-30 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2",
          recording
            ? "border-red-500/50 bg-red-600"
            : recState === "countdown"
              ? "border-amber-400/50 bg-amber-500 text-neutral-950"
              : recState === "uploading"
                ? "border-sky-400/40 bg-sky-700"
                : "border-white/10 bg-neutral-900",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">
            Blaast · {viewport.label} · {operator.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={busy || recording || stepIndex <= 0}
              onClick={() => void goPrev()}
              className="inline-flex size-7 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 disabled:opacity-30"
              title="Previous step"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={busy || recording}
              onClick={() => {
                setStepsOpen((v) => !v);
                setTagPanelOpen(false);
                setCommentOpen(false);
              }}
              className="inline-flex max-w-[min(100%,420px)] items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-left text-[13px] font-semibold hover:bg-black/30"
              title="All steps"
            >
              <List className="size-3.5 shrink-0 opacity-70" />
              <span className="truncate">
                {journeyMeta
                  ? `${journeyMeta.name} · `
                  : ""}
                {primaryIndex >= 0
                  ? `${primaryIndex + 1}/${primarySteps.length}`
                  : `${stepIndex + 1}/${coverageSteps.length}`}
                : {step?.instruction ?? "Done"}
                {step && !step.required ? " (optional)" : ""}
              </span>
            </button>
            <button
              type="button"
              disabled={
                busy || recording || stepIndex >= coverageSteps.length - 1
              }
              onClick={() => void goNext()}
              className="inline-flex size-7 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 disabled:opacity-30"
              title="Next step"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {recording ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            REC {formatElapsed(elapsedSec)}
            <span className="ml-1 font-normal opacity-80">
              — stop when the task is done
            </span>
          </span>
        ) : recState === "countdown" ? (
          <span className="text-[22px] font-bold tabular-nums">{countdown}</span>
        ) : recState === "uploading" ? (
          <span className="text-[12px] font-semibold">Saving clip…</span>
        ) : (
          <span
            className="max-w-[280px] truncate rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70"
            title={viewport.tip}
          >
            {viewport.label} · {viewport.width}×{viewport.height}
          </span>
        )}

        {recording ? (
          <>
            <button
              type="button"
              onClick={reloadSite}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-3 text-[12px] font-semibold hover:bg-white/30"
              title="Reload the site window — keeps recording if you shared the Window"
            >
              <RefreshCw className="size-3.5" />
              Reload site
            </button>
            <button
              type="button"
              onClick={() => void finishRecording()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-red-700"
            >
              <Square className="size-3.5 fill-current" />
              Stop
            </button>
          </>
        ) : (
          <>
            {shareLive && (
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-200 sm:inline-flex">
                Window locked
                <button
                  type="button"
                  onClick={releaseShare}
                  className="underline opacity-80 hover:opacity-100"
                  title="Drop the shared window (next Record will ask again)"
                >
                  release
                </button>
              </span>
            )}
            <button
              type="button"
              disabled={busy || !step}
              onClick={() => void startCountdown("normal")}
              className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-neutral-950 disabled:opacity-40"
            >
              {shareLive ? "Record next" : "Start recording"}
            </button>
            <button
              type="button"
              disabled={busy || !step}
              onClick={() => void startCountdown("page_load")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-3 text-[12px] font-medium hover:bg-black/35 disabled:opacity-40"
              title="Starts recording, then reloads the site so you catch skeletons/loaders"
            >
              <RefreshCw className="size-3.5" />
              Record page load
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setCommentOpen(true);
            setTagPanelOpen(false);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-3 text-[12px] font-medium hover:bg-black/35"
        >
          <MessageSquarePlus className="size-3.5" />
          Comment
        </button>

        <button
          type="button"
          onClick={() => {
            setTagPanelOpen((v) => !v);
            setCommentOpen(false);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-3 text-[12px] font-medium hover:bg-black/35"
        >
          <Tag className="size-3.5" />
          Tag
          {liveTags.length > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
              {liveTags.length}
            </span>
          )}
        </button>

        <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px]">
          {artifacts.length} clip{artifacts.length === 1 ? "" : "s"}
        </span>
      </header>

      {/* Step picker — Step 1 is first in this list */}
      {stepsOpen && (
        <div className="absolute left-3 top-16 z-40 max-h-[min(70vh,480px)] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-[13px] font-semibold">Coverage steps</p>
            <button type="button" onClick={() => setStepsOpen(false)}>
              <X className="size-4 text-white/50" />
            </button>
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-1.5">
            {coverageSteps.map((s, i) => {
              const art = artifacts.find((a) => a.coverageStepId === s.id);
              const active = s.id === step?.id;
              const st =
                session.items.find((it) => it.playbookItemId === s.id)
                  ?.status ?? "todo";
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void goToStep(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px]",
                      active
                        ? "bg-white text-neutral-950"
                        : "hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        active
                          ? "bg-neutral-950 text-white"
                          : art
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/50",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {s.instruction}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[10px]",
                        active ? "text-neutral-500" : "text-white/35",
                      )}
                    >
                      {art ? "clip" : st}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tag / comment overlays */}
      {tagPanelOpen && (
        <div className="absolute left-3 top-16 z-40 w-[min(92vw,340px)] rounded-2xl border border-white/15 bg-neutral-900 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold">Tag what you see</p>
            <button type="button" onClick={() => setTagPanelOpen(false)}>
              <X className="size-4 text-white/50" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((q) => (
              <button
                key={q.tag}
                type="button"
                onClick={() => void addAnnotation({ label: q.label, tag: q.tag })}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] hover:bg-white/10"
              >
                {q.label}
              </button>
            ))}
          </div>
          {liveTags.length > 0 && (
            <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-[11px] text-white/70">
              {liveTags.map((a) => (
                <li key={a.id}>
                  {a.label}
                  {a.comment ? ` — ${a.comment}` : ""}
                  {a.atMs != null ? ` @${Math.round(a.atMs / 1000)}s` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {commentOpen && (
        <div className="absolute left-3 top-16 z-40 w-[min(92vw,360px)] rounded-2xl border border-white/15 bg-neutral-900 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold">Leave a comment</p>
            <button type="button" onClick={() => setCommentOpen(false)}>
              <X className="size-4 text-white/50" />
            </button>
          </div>
          <textarea
            autoFocus
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="e.g. this is the VIP block under the header"
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] outline-none placeholder:text-white/30 focus:border-white/30"
          />
          <button
            type="button"
            disabled={!commentText.trim()}
            onClick={() => void submitComment()}
            className="mt-2 h-9 w-full rounded-full bg-white text-[13px] font-semibold text-neutral-950 disabled:opacity-40"
          >
            Save comment
            {recording ? " at this moment" : ""}
          </button>
        </div>
      )}

      {/* Site stage */}
      <div className="relative min-h-0 flex-1 bg-neutral-800">
        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75">
            <p className="text-[12px] uppercase tracking-[0.2em] text-white/50">
              Starting in
            </p>
            <span className="text-[120px] font-semibold tabular-nums text-white">
              {countdown}
            </span>
            <p className="max-w-sm text-center text-[13px] text-white/60">
              When Chrome asks, pick the{" "}
              <strong className="text-white">{operator.name} Window</strong>{" "}
              (not a Chrome Tab — tab refresh kills the recording)
            </p>
          </div>
        )}

        {/*
          Operators (Rainbet etc.) send X-Frame-Options / CSP that refuse iframes.
          We never proxy/strip those headers — open a real tab instead.
        */}
        <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="max-w-md">
            <p className="text-[15px] font-semibold text-white">
              {operator.name} blocks embeds
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              Same as most gambling sites — they refuse to load inside another
              app. Site opens in its own window;{" "}
              <span className="text-white/80">this window is your remote</span>{" "}
              (record, comment, tag).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={openSite}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-neutral-950"
            >
              <ExternalLink className="size-4" />
              {siteOpen ? "Reopen site window" : `Open ${operator.name}`}
            </button>
            {siteOpen && (
              <button
                type="button"
                onClick={() => {
                  try {
                    siteWinRef.current?.focus();
                  } catch {
                    openSite();
                  }
                }}
                className="inline-flex h-11 items-center rounded-full bg-white/10 px-5 text-[14px] font-medium hover:bg-white/15"
              >
                Focus site
              </button>
            )}
          </div>

          <ol className="max-w-sm space-y-1.5 text-left text-[12px] leading-relaxed text-white/45">
            <li>1. Site window opens automatically (allow popups once).</li>
            <li>
              2. First Record — pick the{" "}
              <span className="text-white/70">{operator.name} Window</span> once
              (Chrome requires it). Later beats reuse that share.
            </li>
            <li>
              3. Loaders:{" "}
              <span className="text-white/70">Record page load</span> /{" "}
              <span className="text-white/70">Reload site</span> while REC is on.
            </li>
          </ol>

          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium",
              siteOpen
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-white/10 text-white/50",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                siteOpen ? "bg-emerald-400" : "bg-white/30",
              )}
            />
            {siteOpen ? "Site window open" : "Site window closed"}
          </p>
        </div>
      </div>

      {/* Clip filmstrip — open one to tag sections */}
      <section className="shrink-0 border-t border-white/10 bg-neutral-950 px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Film className="size-4 text-white/50" />
            <p className="text-[12px] font-semibold">Clips</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">
              {artifacts.length}
            </span>
          </div>
          <p className="text-[11px] text-white/40">
            Click a clip to open · pause · tag sections
          </p>
        </div>

        {artifacts.length === 0 ? (
          <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-white/15 text-[12px] text-white/40">
            No video yet — Stop a recording and it lands here
          </div>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {artifacts.map((art, i) => {
              const label =
                coverageSteps.find((s) => s.id === art.coverageStepId)
                  ?.instruction ?? `Clip ${i + 1}`;
              const tagCount = art.annotations?.length ?? 0;
              return (
                <li key={art.id}>
                  <button
                    type="button"
                    onClick={() => setReviewClipId(art.id)}
                    className="w-[168px] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 text-left transition-colors hover:border-amber-400/60 hover:bg-white/10"
                  >
                    <div className="relative aspect-video bg-neutral-800">
                      {art.posterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src={`/api/admin/sessions/${session.id}/artifacts/${art.id}?file=poster`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Film className="size-5 text-white/25" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                        {art.durationMs
                          ? `${Math.round(art.durationMs / 1000)}s`
                          : "video"}
                      </span>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[11px] font-medium text-white/90">
                        {label}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {tagCount
                          ? `${tagCount} tag${tagCount === 1 ? "" : "s"} · Open`
                          : "Open to tag"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {reviewClip && (
        <ClipReviewModal
          open
          tone="dark"
          sessionId={session.id}
          clip={reviewClip}
          title={
            coverageSteps.find((s) => s.id === reviewClip.coverageStepId)
              ?.instruction ?? "Clip"
          }
          onClose={() => setReviewClipId(null)}
          onDelete={() => void deleteClip(reviewClip)}
          onSession={(s) => {
            setSession(s);
            const updated = s.artifacts?.find((a) => a.id === reviewClip.id);
            if (updated) setLastClip(updated);
          }}
        />
      )}
    </div>
  );
}

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
