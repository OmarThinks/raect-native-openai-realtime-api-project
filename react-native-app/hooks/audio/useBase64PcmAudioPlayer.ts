import { useCallback, useEffect, useRef, useState } from "react";
import { AudioBufferSourceNode, AudioContext } from "react-native-audio-api";

const useBase64PcmAudioPlayer = ({ sampleRate }: { sampleRate: number }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const cleanUp = useCallback(() => {
    setIsAudioPlaying(false);

    try {
      audioBufferSourceNodeRef.current?.stop?.();
    } catch {}
    audioBufferSourceNodeRef.current = null;
  }, []);

  useEffect(() => {
    cleanUp();

    const audioContext = new AudioContext({ sampleRate });
    audioContextRef.current = audioContext;

    return () => {
      cleanUp();
    };
  }, [cleanUp, sampleRate]);

  const playPcmBase64Audio = useCallback(
    async ({ base64String }: { base64String: string }) => {
      if (audioContextRef.current) {
        const audioBuffer =
          await audioContextRef.current?.decodePCMInBase64Data(base64String);

        const audioBufferSourceNode =
          audioContextRef.current.createBufferSource();
        audioBufferSourceNode.connect(audioContextRef.current.destination);

        audioBufferSourceNode.buffer = audioBuffer;
        setIsAudioPlaying(true);
        audioBufferSourceNode.onEnded = () => {
          cleanUp();
        };
        audioBufferSourceNode.start();
        audioBufferSourceNodeRef.current = audioBufferSourceNode;
      }
    },
    [cleanUp]
  );

  return { isAudioPlaying, playPcmBase64Audio, stopPlayingAudio: cleanUp };
};

export { useBase64PcmAudioPlayer };
