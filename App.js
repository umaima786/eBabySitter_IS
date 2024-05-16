import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Provider as PaperProvider, Button, Appbar, Card } from 'react-native-paper';

const App = () => {
  const [showCamera, setShowCamera] = useState(false);

  const toggleCameraOn = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/show-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ show_camera: true }), // Turn on the camera
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
    
      setShowCamera(false);
   
  };

  const playSong = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/play-song', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.success) {
        console.log(`Playing song: ${data.song}`);
      } else {
        console.error('Error playing song:', data.message);
      }
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
          <Appbar.Content title="Camera and Music App" />
        </Appbar.Header>
        <Card style={styles.card}>
          {showCamera && <Image source={{ uri: 'http://127.0.0.1:5000/api/camera-feed' }} style={styles.cameraFeed} />}
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
