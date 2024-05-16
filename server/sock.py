import socket

# Host and port for the server
HOST = '0.0.0.0'  # Listen on all network interfaces
PORT = 3000     # Port number

# Create a socket object
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bind the socket to the host and port
server_socket.bind((HOST, PORT))

# Listen for incoming connections
server_socket.listen(1)

print('Server is listening on port', PORT)

# Accept incoming connection
client_socket, addr = server_socket.accept()
print('Connected by', addr)

while True:
    # Receive data from the client
    data = client_socket.recv(1024)
    if not data:
        break
    print('Received from client:', data.decode())

    # Send a response back to the client
    client_socket.sendall(b'Received data: ' + data)

# Close the connection
client_socket.close()
server_socket.close()
