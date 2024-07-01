import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Provider as PaperProvider, Button, Appbar, Card } from 'react-native-paper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import GenerateAndUpload from './GenerateAndUpload'; 
import AudioUpload from './AudioUpload';

const App = ({ navigation }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);

  useEffect(() => {
    // Polling function to check face detection status
    const pollFaceStatus = async () => {
      try {
        const response = await fetch('http://192.168.178.53:5000/api/face-status');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.no_face_detected) {
          const currentTime = Date.now();
          if (currentTime - lastToastTime > 10000) { // Check if 10 seconds have passed
            toast.error('No face detected'); // Show a toast notification with the message
            setLastToastTime(currentTime); // Update the last toast time
          }
        }
      } catch (error) {
        console.error('Error fetching face status:', error);
      }
    };

    // Set an interval to poll face status every 2 seconds
    const intervalId = setInterval(pollFaceStatus, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [lastToastTime]);

  const toggleCameraOn = async () => {
    try {
      const response = await fetch('http://192.168.178.53:5000/api/show-camera', {
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
      const response = await fetch('http://192.168.178.53:5000/api/turn-off-camera', {
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
      const response = await fetch('http://192.168.178.53:5000/api/play-song', {
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
      const response = await fetch('http://192.168.178.53:5000/api/stop-song', {
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
          {showCamera && <Image source={{ uri: 'http://192.168.178.53:5000/api/camera-feed' }} style={styles.cameraFeed} />}
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
