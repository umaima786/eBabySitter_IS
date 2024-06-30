import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Provider as PaperProvider, Button, Appbar, Card } from 'react-native-paper';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import GenerateAndUpload from './GenerateAndUpload'; 
import AudioUpload from './AudioUpload';

const App = ({ navigation }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);
  const socket = io('http://192.168.43.173:5000');
  
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Python server via WebSocket');
    });

    socket.on('no_face_detected', (data) => {
      console.log("Received 'no_face_detected' event:", data);
      const currentTime = Date.now();
      if (currentTime - lastToastTime > 10000) {
        toast.error(data.message);
        setLastToastTime(currentTime);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [lastToastTime]);

  const toggleCameraOn = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/show-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ show_camera: true }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error turning on camera:', error);
    }
  };

  const toggleCameraOff = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/turn-off-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ show_camera: false }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setShowCamera(false);
    } catch (error) {
      console.error('Error turning off camera:', error);
    }
  };

  const playSong = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/play-song', {
        method: 'POST',
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
      const response = await fetch('http://192.168.43.173:5000/api/stop-song', {
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
          {showCamera && <Image source={{ uri: 'http://192.168.43.173:5000/api/camera-feed' }} style={styles.cameraFeed} />}
          <Card.Actions>
            <Button mode="contained" onPress={toggleCameraOn} style={styles.button} disabled={showCamera}>
              Turn On Camera
            </Button>
            <Button mode="contained" onPress={toggleCameraOff} style={styles.button} disabled={!showCamera}>
              Turn Off Camera
            </Button>
          </Card.Actions>
        </Card>
        <Card style={styles.card}>
          <Card.Actions>
            <Button mode="contained" onPress={playSong} style={styles.button}>
              Play a Song
            </Button>
            <Button mode="contained" onPress={stopSong} style={styles.button}>
              Stop Song
            </Button>
          </Card.Actions>
        </Card>
        <GenerateAndUpload /> 
        <AudioUpload />
        <ToastContainer />
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
  button: {
    margin: 10,
  },
});

export default App;
