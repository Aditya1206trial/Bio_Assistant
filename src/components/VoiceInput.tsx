import { useState, useRef } from "react";
import { Mic, StopCircle } from "lucide-react";
import * as React from "react";

interface VoiceInputProps {
  onVoiceResponse: (question: string, answer: string, audio: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceResponse }) => {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder.current) return;

    mediaRecorder.current.stop();
    setRecording(false);

    mediaRecorder.current.onstop = async () => {
      setLoading(true);
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      audioChunks.current = [];

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "query.webm");

        const response = await fetch("http://localhost:8000/api/voice-query", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        // Pass question, answer, and audio (base64) to parent
        onVoiceResponse(data.question, data.answer, data.audio);
      } catch (err) {
        console.error("Voice query failed:", err);
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
      disabled={loading}
      title={recording ? "Stop recording" : "Start voice query"}
    >
      {recording ? (
        <StopCircle className="h-6 w-6 text-red-600" />
      ) : (
        <Mic className="h-6 w-6 text-blue-600" />
      )}
    </button>
  );
};
