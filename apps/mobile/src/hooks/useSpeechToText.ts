// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// USE SPEECH TO TEXT
// ==========================================
import { useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";

type UseSpeechToTextOptions = {
  enabled?: boolean;
  onResult?: (text: string) => void;
  onPartial?: (text: string) => void;
  onError?: (error: string) => void;
};

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { enabled = true, onResult, onPartial, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [partial, setPartial] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const onResultRef = useRef(onResult);
  const onPartialRef = useRef(onPartial);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onPartialRef.current = onPartial;
    onErrorRef.current = onError;
  }, [onResult, onPartial, onError]);

  useEffect(() => {
    setVoiceAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
  }, [enabled]);

  useSpeechRecognitionEvent("start", () => {
    if (!enabled) return;
    setIsRecording(true);
  });

  useSpeechRecognitionEvent("result", (event: ExpoSpeechRecognitionResultEvent) => {
    if (!enabled) return;
    const value = event.results[0]?.transcript?.trim() ?? "";
    if (!value) return;

    if (event.isFinal) {
      setPartial("");
      onResultRef.current?.(value);
      return;
    }

    setPartial(value);
    onPartialRef.current?.(value);
  });

  useSpeechRecognitionEvent("error", (event: ExpoSpeechRecognitionErrorEvent) => {
    if (!enabled) return;
    const message = event.message || "Erro ao reconhecer voz";
    onErrorRef.current?.(message);
    setIsRecording(false);
  });

  useSpeechRecognitionEvent("end", () => {
    if (!enabled) return;
    setIsRecording(false);
    setPartial("");
  });

  const ensureSpeechPermission = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return permission.granted;
  };

  const start = async (locale = "pt-BR") => {
    if (!enabled) {
      return;
    }

    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    setVoiceAvailable(available);
    if (!available) {
      const message = "Reconhecimento de voz indisponivel neste ambiente";
      onErrorRef.current?.(message);
      throw new Error(message);
    }

    const hasPermission = await ensureSpeechPermission();
    if (!hasPermission) {
      const message = "Permissao de microfone negada";
      onErrorRef.current?.(message);
      throw new Error(message);
    }

    setPartial("");
    ExpoSpeechRecognitionModule.start({
      lang: locale,
      interimResults: true,
      continuous: false,
    });
    setIsRecording(true);
  };

  const stop = async () => {
    if (!enabled || !voiceAvailable) {
      return;
    }

    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
    setPartial("");
  };

  const cancel = async () => {
    if (!enabled || !voiceAvailable) {
      return;
    }

    ExpoSpeechRecognitionModule.abort();
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
