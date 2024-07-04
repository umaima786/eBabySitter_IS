from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import pygame
import os
import time
import base64
import threading
import random
import string
from werkzeug.utils import secure_filename
from routes.auth import auth_blueprint 
import requests

app = Flask(__name__)
CORS(app)

show_camera = False

# Initialize pygame mixer for playing audio
pygame.mixer.init()

# Load pre-trained face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

app.register_blueprint(auth_blueprint)

NODE_SERVER_URL = 'http://localhost:3000/'



def generate_camera_frames():
    camera = cv2.VideoCapture(0)
    while True:
        if show_camera:
            success, frame = camera.read()
            if not success:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            if len(faces) == 0:
                print('no face detected')
                # When no face is detected, send a POST request to update face_found to false
                try:
                    requests.post(NODE_SERVER_URL + 'update-face-status', json={'face_found': False})

                except requests.exceptions.RequestException as e:
                    print(f"Error updating face_found: {e}")
            else:
                ret, jpeg = cv2.imencode('.jpg', frame)
                frame_bytes = jpeg.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + open('placeholder.jpg', 'rb').read() + b'\r\n')
@app.route('/api/data')
def get_data():
    data = {'message': 'Hello from Python server!'}
    return jsonify(data)

@app.route('/api/show-camera', methods=['POST'])
def toggle_camera():
    global show_camera
    show_camera = True
    return jsonify({'success': True})

@app.route('/api/turn-off-camera', methods=['POST'])
def turn_off_camera():
    global show_camera
    show_camera = False
    return jsonify({'success': True})

@app.route('/api/camera-feed')
def camera_feed():
    return Response(generate_camera_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/list-songs', methods=['GET'])
def list_songs():
    sounds_dir = os.path.join(os.path.dirname(__file__), 'sounds')
    songs = [song for song in os.listdir(sounds_dir) if song.endswith('.mp3') or song.endswith('.wav')]
    return jsonify({'songs': songs})

@app.route('/api/play-song', methods=['POST'])
def play_song():
    data = request.json
    song_to_play = data.get('song')

    if not song_to_play:
        return jsonify({'success': False, 'message': 'No song specified'})

    sounds_dir = os.path.join(os.path.dirname(__file__), 'sounds')
    song_path = os.path.join(sounds_dir, song_to_play)

    if not os.path.exists(song_path):
        return jsonify({'success': False, 'message': 'Song not found'})

    pygame.mixer.music.load(song_path)
    pygame.mixer.music.play()

    return jsonify({'success': True, 'song': song_to_play})

@app.route('/api/stop-song', methods=['POST'])
def stop_song():
    pygame.mixer.music.stop()
    return jsonify({'success': True})

# Upload folder configuration
UPLOAD_FOLDER = './server/sounds'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)  
        print(filepath)  
    
        #play_audio(filepath)
        return jsonify({"message": "File uploaded successfully", "filename": filename}), 200

def play_audio(file_path):
    try:
        # Initialize pygame mixer and play the audio file
        pygame.mixer.init()
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()

        # Wait for the playback to finish
        while pygame.mixer.music.get_busy():
            time.sleep(1)
    except Exception as e:
        print(f"Error playing audio: {e}")

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    audio_data = request.json.get('audioData')

    # Process the Base64 string (decode and save as MP3 file)
    try:
        # Decode the Base64 string
        audio_binary = base64.b64decode(audio_data)
        print(audio_binary)
        # Ensure the audio file is properly saved
        file_path = 'uploaded_audio.mp3'
        with open(file_path, 'wb') as f:
            f.write(audio_binary)

        # Verify the file is properly saved
        if os.path.getsize(file_path) == 0:
            raise ValueError("File is empty or corrupt")

        # Start a new thread to play the audio
        playback_thread = threading.Thread(target=play_audio, args=(file_path,))
        playback_thread.start()

        # Return a response immediately
        return jsonify({'message': 'Audio uploaded successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_random_string_with_extension(length):
    letters = string.ascii_letters + string.digits
    random_string = ''.join(random.choices(letters, k=length))
    return random_string + ".mp3"

# Save folder configuration
SAVE_FOLDER = 'save'
if not os.path.exists(SAVE_FOLDER):
    os.makedirs(SAVE_FOLDER)
app.config['SAVE_FOLDER'] = SAVE_FOLDER

@app.route('/save', methods=['POST'])
def save_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = generate_random_string_with_extension(6)
        filepath = os.path.join(app.config['SAVE_FOLDER'], filename)
        file.save(filepath)  
        print(filepath)  
    
        #play_audio(filepath)
        return jsonify({"message": "audio saved successfully", "filename": filename}), 200

@app.route('/api/delete-song', methods=['POST'])
def delete_song():
    data = request.json
    song_to_delete = data.get('song')

    if not song_to_delete:
        return jsonify({'success': False, 'message': 'No song specified'})

    sounds_dir = os.path.join(os.path.dirname(__file__), 'sounds')
    song_path = os.path.join(sounds_dir, song_to_delete)

    if not os.path.exists(song_path):
        return jsonify({'success': False, 'message': 'Song not found'})

    try:
        os.remove(song_path)
        return jsonify({'success': True, 'message': 'Song deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/rename-song', methods=['POST'])
def rename_song():
    data = request.json
    old_name = data.get('oldName')
    new_name = data.get('newName')

    if not old_name or not new_name:
        return jsonify({'success': False, 'message': 'Old name or new name not specified'})

    sounds_dir = os.path.join(os.path.dirname(__file__), 'sounds')
    old_path = os.path.join(sounds_dir, old_name)
    new_path = os.path.join(sounds_dir, new_name)

    if not os.path.exists(old_path):
        return jsonify({'success': False, 'message': 'Song not found'})

    try:
        os.rename(old_path, new_path)
        return jsonify({'success': True, 'message': 'Song renamed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
