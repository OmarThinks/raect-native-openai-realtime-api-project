import { Button, View } from "react-native";
import { dummyMessages } from "@/samples/dummyMessages";
import { useAudioBufferQueue } from "@/hooks/audio/useAudioBufferQueue";
import { AudioContext } from "react-native-audio-api";

export default function TabTwoScreen() {
  const {
    enqueueAudioBufferQueue,
    isAudioPlaying,
    playAudio,
    stopPlayingAudio,
  } = useAudioBufferQueue({ sampleRate: 24000 });

  return (
    <View className=" self-stretch flex-1 justify-center items-stretch">
      <Button
        title="Test"
        onPress={async () => {
          for (const message of dummyMessages) {
            const audioContext = new AudioContext({ sampleRate: 24000 });
            if (message.type === "response.audio.delta") {
              const pcmText = message.delta!;
              const audioBuffer =
                await audioContext.decodePCMInBase64Data(pcmText);
              enqueueAudioBufferQueue(audioBuffer);
            }
          }

          playAudio();
        }}
      />
    </View>
  );
}
