import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Button, Picker, Text, TextInput } from 'react-native';
import { Provider as PaperProvider, Appbar, Card } from 'react-native-paper';
import io from 'socket.io-client'; 
import AudioUpload from './AudioUpload';
import GenerateAndUpload from './GenerateAndUpload';

const App = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [newSongName, setNewSongName] = useState('');
  const socket = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      await fetchSongs();
      const interval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3000/api/face-status');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          console.log('Face Status:', data);
        } catch (error) {
          console.error('Error fetching face status:', error);
        }
      }, 5000);
      return () => clearInterval(interval);
    };
    fetchData();
    return () => {};
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/list-songs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSongs(data.songs);
      setSelectedSong(data.songs[0]);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

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
      const response = await fetch('http://192.168.43.173:5000/api/play-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song: selectedSong }), 
        mode: 'cors'
      });
      console.log(response);
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

  const deleteSong = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/delete-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song: selectedSong }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data.message);
      await fetchSongs(); // Refresh song list
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const renameSong = async () => {
    try {
      const response = await fetch('http://192.168.43.173:5000/api/rename-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldName: selectedSong, newName: newSongName }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data.message);
      await fetchSongs(); // Refresh song list
    } catch (error) {
      console.error('Error renaming song:', error);
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
            <Button title="Turn On Camera" onPress={toggleCameraOn} disabled={showCamera} />
            <Button title="Turn Off Camera" onPress={toggleCameraOff} disabled={!showCamera} />
          </Card.Actions>
        </Card>
        <Card style={styles.card}>
          <Picker
            selectedValue={selectedSong}
            onValueChange={(itemValue) => setSelectedSong(itemValue)}
          >
            {songs.map((song, index) => (
              <Picker.Item key={index} label={song} value={song} />
            ))}
          </Picker>
          <Card.Actions>
            <Button title="Play Selected Song" onPress={playSong} />
            <Button title="Stop Song" onPress={stopSong} />
            <Button title="Delete Song" onPress={deleteSong} />
          </Card.Actions>
          <TextInput
            style={styles.input}
            placeholder="New song name"
            value={newSongName}
            onChangeText={setNewSongName}
          />
          <Button title="Rename Song" onPress={renameSong} />
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
    margin: 10,
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
});

export default App;
