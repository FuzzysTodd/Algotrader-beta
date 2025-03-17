#include <winsock2.h>
#include <windows.h>
#include <iostream>
#include <string>
#include <sstream>
#include <iomanip>
#include <cstdint>
#include <ctime>
#include <bcrypt.h>

#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "ws2_32.lib")

extern "C" __declspec(dllexport) void SendMarketData(const char* symbol, double bid, double ask) {
    // Initialize Winsock
    static bool winsockInitialized = false;
    WSADATA wsaData;
    if (!winsockInitialized) {
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            std::cerr << "[ERROR] WSAStartup failed!" << std::endl;
            return;
        }
        winsockInitialized = true;
    }

    // Create socket
    SOCKET sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == INVALID_SOCKET) {
        std::cerr << "[ERROR] Socket creation failed!" << std::endl;
        return;
    }

    // Connect to Node.js WebSocket server
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(8080);
    serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1");

    if (connect(sock, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "[ERROR] Connection to Node.js failed!" << std::endl;
        closesocket(sock);
        return;
    }

    // Perform WebSocket handshake
    std::string handshake = "GET / HTTP/1.1\r\n"
                            "Host: 127.0.0.1:8080\r\n"
                            "Upgrade: websocket\r\n"
                            "Connection: Upgrade\r\n"
                            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
                            "Sec-WebSocket-Version: 13\r\n\r\n";

    if (send(sock, handshake.c_str(), handshake.length(), 0) == SOCKET_ERROR) {
        std::cerr << "[ERROR] Handshake send failed!" << std::endl;
        closesocket(sock);
        return;
    }

    char buffer[1024];
    int bytesRead = recv(sock, buffer, sizeof(buffer) - 1, 0);
    if (bytesRead <= 0) {
        std::cerr << "[ERROR] Handshake failed!" << std::endl;
        closesocket(sock);
        return;
    }
    buffer[bytesRead] = '\0';  // Null-terminate to prevent overflow

    // Prepare market data message in JSON format
    std::ostringstream oss;
    oss << "{\"symbol\":\"" << symbol << "\",\"bid\":" << std::fixed << std::setprecision(5) << bid
        << ",\"ask\":" << ask << "}";
    std::string message = oss.str();

    if (message.size() > 1024 - 10) { // Ensure frame fits in buffer
        std::cerr << "[ERROR] Message too large for frame!" << std::endl;
        closesocket(sock);
        return;
    }

    // Dynamically allocate frame buffer
    int messageLength = message.size();
    int frameSize = 0;
    uint8_t* frame = new uint8_t[messageLength + 10];

    frame[frameSize++] = 0x81;  // FIN + text frame

    if (messageLength <= 125) {
        frame[frameSize++] = 0x80 | messageLength;  // Mask bit set
    } else if (messageLength <= 65535) {
        frame[frameSize++] = 0x80 | 126;  // Mask bit set, 16-bit length
        frame[frameSize++] = (messageLength >> 8) & 0xFF;
        frame[frameSize++] = messageLength & 0xFF;
    }

    // Generate random masking key (improved randomness)
    uint8_t maskKey[4];
    if (BCryptGenRandom(NULL, maskKey, sizeof(maskKey), BCRYPT_USE_SYSTEM_PREFERRED_RNG) != 0) {
        std::cerr << "[ERROR] Failed to generate random masking key!" << std::endl;
        delete[] frame;
        closesocket(sock);
        return;
    }    

    // Add masking key to the frame
    memcpy(frame + frameSize, maskKey, 4);
    frameSize += 4;

    // Mask and append payload
    for (int i = 0; i < messageLength; ++i) {
        frame[frameSize++] = message[i] ^ maskKey[i % 4];
    }

    // Send the frame
    if (send(sock, (char*)frame, frameSize, 0) == SOCKET_ERROR) {
        std::cerr << "[ERROR] Data send failed!" << std::endl;
        delete[] frame;
        closesocket(sock);
        return;
    }

    std::cout << "[INFO] Data sent successfully: " << message << std::endl;

    // Cleanup
    delete[] frame;
    if (closesocket(sock) == SOCKET_ERROR) {
        std::cerr << "[ERROR] Failed to close socket!" << std::endl;
    }
}
