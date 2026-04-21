// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// USE SPEECH TO TEXT
// ==========================================
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

type UseSpeechToTextOptions = {
  enabled?: boolean;
  onResult?: (text: string) => void;
  onPartial?: (text: string) => void;
  onError?: (error: string) => void;
};

type SpeechResultsEvent = { value?: string[] };
type SpeechErrorEvent = { error?: { message?: string } };
type VoiceModule = {
  onSpeechResults: ((event: SpeechResultsEvent) => void) | null;
  onSpeechPartialResults: ((event: SpeechResultsEvent) => void) | null;
  onSpeechError: ((event: SpeechErrorEvent) => void) | null;
  onSpeechEnd: ((event?: unknown) => void) | null;
  start: (locale: string) => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  destroy: () => Promise<void>;
  removeAllListeners: () => void;
};

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { enabled = true, onResult, onPartial, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [partial, setPartial] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const onResultRef = useRef(onResult);
  const onPartialRef = useRef(onPartial);
  const onErrorRef = useRef(onError);
  const voiceRef = useRef<VoiceModule | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
    onPartialRef.current = onPartial;
    onErrorRef.current = onError;
  }, [onResult, onPartial, onError]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const handleResults = (event: SpeechResultsEvent) => {
      const value = event.value?.join(" ").trim();
      if (value) {
        onResultRef.current?.(value);
      }
    };

    const handlePartial = (event: SpeechResultsEvent) => {
      const value = event.value?.join(" ").trim() ?? "";
      setPartial(value);
      if (value) {
        onPartialRef.current?.(value);
      }
    };

    const handleError = (event: SpeechErrorEvent) => {
      const message = event.error?.message ?? "Erro ao reconhecer voz";
      onErrorRef.current?.(message);
      setIsRecording(false);
    };

    const handleEnd = () => {
      setIsRecording(false);
      setPartial("");
    };

    const setup = async () => {
      try {
        const mod = await import("@react-native-voice/voice");
        const Voice = (mod.default || mod) as unknown as VoiceModule;
        if (!mounted) return;
        voiceRef.current = Voice;
        Voice.onSpeechResults = handleResults;
        Voice.onSpeechPartialResults = handlePartial;
        Voice.onSpeechError = handleError;
        Voice.onSpeechEnd = handleEnd;
        setVoiceAvailable(true);
      } catch {
        if (!mounted) return;
        voiceRef.current = null;
        setVoiceAvailable(false);
        onErrorRef.current?.("Reconhecimento de voz indisponivel neste ambiente");
      }
    };

    setup().catch(() => undefined);

    return () => {
      mounted = false;
      const Voice = voiceRef.current;
      if (!Voice) return;
      try {
        Voice.destroy().catch(() => undefined);
      } catch {
        // ignore runtime mismatch for native voice module
      }
      try {
        Voice.removeAllListeners();
      } catch {
        // ignore runtime mismatch for native voice module
      }
    };
  }, [enabled]);

  const ensureMicPermission = async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const start = async (locale = "pt-BR") => {
    const Voice = voiceRef.current;
    if (!enabled || !voiceAvailable || !Voice) {
      return;
    }

    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
      const message = "Permissao de microfone negada";
      onErrorRef.current?.(message);
      throw new Error(message);
    }

    setPartial("");
    await Voice.start(locale);
    setIsRecording(true);
  };

  const stop = async () => {
    const Voice = voiceRef.current;
    if (!enabled || !voiceAvailable || !Voice) {
      return;
    }

    await Voice.stop();
    setIsRecording(false);
    setPartial("");
  };

  const cancel = async () => {
    const Voice = voiceRef.current;
    if (!enabled || !voiceAvailable || !Voice) {
      return;
    }

    await Voice.cancel();
    setIsRecording(false);
    setPartial("");
  };

  return {
    isRecording,
    partial,
    start,
    stop,
    cancel,
  };
}
