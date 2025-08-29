import useOpenAiRealTimeWithAudio from "@/hooks/ai/useOpenAiRealTimeWithAudio";
import { Button, Text, View } from "react-native";

function HomeScreen() {
  const {
    connect,
    disconnect,
    isAiResponding,
    isConnected,
    isConnecting,
    isListening,
    isStreamingAudio,
    transcription,
  } = useOpenAiRealTimeWithAudio();

  return (
    <View className="flex-1 items-stretch justify-center bg-white p-4">
      {isConnecting ? (
        <Text>Connecting...</Text>
      ) : (
        <Button
          title={isConnected ? "Disconnect" : "Connect"}
          onPress={isConnected ? disconnect : connect}
        />
      )}

      <Text>Is Listening: {`${isListening}`}</Text>

      <Text>Is Microphone Active: {`${isStreamingAudio}`}</Text>

      <Text> Transcription: {transcription}</Text>
    </View>
  );
}

export default HomeScreen;
