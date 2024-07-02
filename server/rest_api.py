from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from picamera2 import Picamera2
import cv2
import pygame
import os
import random
import string
from werkzeug.utils import secure_filename
import threading
import queue
import time
import numpy as np

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def test_connect():
    print('Client connected')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

show_camera = False
picam2 = None
frame_queue = queue.Queue()

# Initialize Pygame mixer with optimized settings
pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=4096)

haarcascade_path = '/home/aown/Desktop/eBabySitter/server/data/haarcascades/haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(haarcascade_path)
if face_cascade.empty():
    print("Failed to load face detection model")

def initialize_camera():
    global picam2
    if picam2 is None:
        try:
            picam2 = Picamera2()
            picam2.configure(picam2.create_preview_configuration(main={"size": (160, 120)}))
            picam2.start()
        except RuntimeError as e:
            print(f"Failed to initialize camera: {e}")
            picam2 = None

def generate_camera_frames():
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            print(f"Detected {len(faces)} faces")
            if len(faces) == 0:
                socketio.emit('no_face_detected', {'message': 'No face detected'})
                print("No face detected")
            for (x, y, w, h) in faces:
                cv2.rectangle(bgr_frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            ret, jpeg = cv2.imencode('.jpg', bgr_frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        if show_camera and picam2 is not None:
            frame = picam2.capture_array()
            if frame is None:
                print("Failed to capture frame")
                continue
            frame_queue.put(frame)

@app.route('/api/data')
def get_data():
    data = {'message': 'Hello from Python server!'}
    return jsonify(data)

@app.route('/api/show-camera', methods=['POST'])
def toggle_camera():
    initialize_camera()
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

# Preload songs
sounds_dir = os.path.join(os.path.dirname(__file__), 'sounds')
songs = [os.path.join(sounds_dir, song) for song in os.listdir(sounds_dir) if song.endswith('.mp3')]

@app.route('/api/play-song', methods=['POST'])
def play_song():
    if not songs:
        return jsonify({'success': False, 'message': 'No songs found in sounds directory'})
    song_to_play = random.choice(songs)
    pygame.mixer.music.load(song_to_play)
    pygame.mixer.music.play()
    return jsonify({'success': True, 'song': os.path.basename(song_to_play)})

@app.route('/api/stop-song', methods=['POST'])
def stop_song():
    pygame.mixer.music.stop()
    return jsonify({'success': True})

UPLOAD_FOLDER = 'uploads'
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
        return jsonify({"message": "File uploaded successfully", "filename": filename}), 200

def generate_random_string_with_extension(length):
    letters = string.ascii_letters + string.digits
    random_string = ''.join(random.choices(letters, k=length))
    return random_string + ".mp3"

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
        return jsonify({"message": "audio saved successfully", "filename": filename}), 200

def start_camera_thread():
    camera_thread = threading.Thread(target=generate_camera_frames)
    camera_thread.daemon = True
    camera_thread.start()

if __name__ == '__main__':
    start_camera_thread()
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
