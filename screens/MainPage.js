import React, { useEffect, useState, useRef } from 'react';
import { View, Image,StyleSheet, Button } from 'react-native';
import { Provider as PaperProvider, Appbar, Card } from 'react-native-paper';
import io from 'socket.io-client'; 
import AudioUpload from './AudioUpload'
import GenerateAndUpload from './GenerateAndUpload'

const App = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const socket = useRef(null);

  useEffect(() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(audioCtx);

    socket.current = io('http://localhost:5000');

    socket.current.on('connect', () => {
      console.log('Connected to Python server via WebSocket');
    });

    socket.current.on('cry_detected', (data) => {
      console.log(data.message);
    });

    socket.current.on('audio_stream', (data) => {
      // Convert the received data from base64 string to ArrayBuffer
      const audioData = new Uint8Array(data).buffer;
      audioCtx.decodeAudioData(audioData, (buffer) => {
        setAudioChunks((prevChunks) => [...prevChunks, buffer]);
      }, (error) => {
        console.error('Error decoding audio data:', error);
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (audioChunks.length > 0 && audioContext) {
      const playAudioChunks = async () => {
        for (const buffer of audioChunks) {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          await new Promise((resolve) => {
            source.onended = resolve;
          });
        }
        setAudioChunks([]);
      };
      playAudioChunks();
    }
  }, [audioChunks, audioContext]);

  const toggleCameraOn = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/show-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ show_camera: true }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      } 
      console.log("showing camera")
      setShowCamera(true);
    } catch (error) {
      console.error('Error turning on camera:', error);
    }
  };

  const toggleCameraOff = async () => {
    setShowCamera(false);
  };

  const playSong = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/play-song', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const stopSong = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/stop-song', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Song stopped');
    } catch (error) {
      console.error('Error stopping song:', error);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="eBabySitter" />
        </Appbar.Header>
        <Card style={styles.card}>
          {showCamera && <Image source={{ uri: 'http://127.0.0.1:5000/api/camera-feed' }} style={styles.cameraFeed} />}
          <Card.Actions>
            <Button title="Turn On Camera" onPress={toggleCameraOn} disabled={showCamera} />
            <Button title="Turn Off Camera" onPress={toggleCameraOff} disabled={!showCamera} />
          </Card.Actions>
        </Card>
        <Card style={styles.card}>
          <Card.Actions>
            <Button title="Play a Song" onPress={playSong} />
            <Button title="Stop Song" onPress={stopSong} />
          </Card.Actions>
        </Card> 
        <AudioUpload/>
        <GenerateAndUpload/>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  cameraFeed: {
    width: '100%',
    height: 300,
  },
  card: {
    margin: 20,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
  },
});

export default App;
