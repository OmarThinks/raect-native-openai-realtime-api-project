import useOpenAiRealTimeWithAudio from "@/hooks/ai/useOpenAiRealTimeWithAudio";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { useCallback } from "react";
import { Alert, Button, Text, View } from "react-native";
import { dummyMessages } from "@/samples/dummyMessages";
import { dummyBase64Audio16k } from "@/samples/dummyBase64Audio";
import { useAudioBufferQueue } from "@/hooks/audio/useAudioBufferQueue";
import { AudioContext } from "react-native-audio-api";

const locaIpAddress = "http://192.168.8.103";

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
    ping,
    logMessages,
    //isAudioPlaying,
    //playAudio,
  } = useOpenAiRealTimeWithAudio();

  const {
    isAudioPlaying,
    enqueueAudioBufferQueue,
    playAudio,
    stopPlayingAudio,
  } = useAudioBufferQueue({ sampleRate: 16000 });

  const _connect = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      console.log("granted", granted);

      if (granted) {
        console.log("getting backend response");
        const tokenResponse = await fetch(`${locaIpAddress}:3000/session`);
        console.log("tokenResponse", tokenResponse);
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;
        console.log("token", EPHEMERAL_KEY);
        connect({ ephemeralToken: EPHEMERAL_KEY });
      } else {
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Something went wrong.");
    }
  }, [connect]);

  return (
    <View className="flex-1 items-stretch justify-center bg-white p-4">
      {isConnecting ? (
        <Text>Connecting...</Text>
      ) : (
        <Button
          title={isConnected ? "Disconnect" : "Connect"}
          onPress={isConnected ? disconnect : _connect}
        />
      )}

      <Text>Is Listening: {`${isListening}`}</Text>

      <Text>Is Microphone Active: {`${isStreamingAudio}`}</Text>

      <Text>isAiResponding: {`${isAiResponding}`}</Text>
      <Text>isAudioPlaying: {`${isAudioPlaying}`}</Text>

      <Text> Transcription: {transcription}</Text>

      {isListening && <Button title="Ping" onPress={ping} />}

      <Button title="Log messages" onPress={logMessages} />
      <Button title="playAudio" onPress={playAudio} />

      <Button
        title="Test"
        onPress={async () => {
          const audioContext = new AudioContext({ sampleRate: 16000 });
          const audioBuffer =
            await audioContext.decodePCMInBase64Data(dummyBase64Audio16k);
          enqueueAudioBufferQueue(audioBuffer);

          playAudio();
        }}
      />
    </View>
  );
}

export default HomeScreen;
