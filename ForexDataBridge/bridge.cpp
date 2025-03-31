#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <string>
#include <mutex>
#include <fstream>
#include <thread>

#pragma comment(lib, "ws2_32.lib")

#define PORT 5050

std::mutex messageMutex;
std::string latestMessage = "";
SOCKET clientSocket = INVALID_SOCKET;
bool serverRunning = false;

// Open log file once at startup
std::ofstream logFile("C:\\Users\\upram\\OneDrive\\Desktop\\workspace\\Forex-Robot\\ForexDataBridge\\bridge.txt", std::ios::app);

// Logging function (flushes after every message)
void LogMessage(const std::string &message)
{
    logFile << message << std::endl;
    logFile.flush();
}

// Convert ANSI to UTF-16 for MQL5
std::wstring ANSItoUnicode(const std::string &ansiStr)
{
    int len = MultiByteToWideChar(CP_ACP, 0, ansiStr.c_str(), -1, NULL, 0);
    if (len == 0)
        return L"";
    std::wstring unicodeStr(len, 0);
    MultiByteToWideChar(CP_ACP, 0, ansiStr.c_str(), -1, &unicodeStr[0], len);
    return unicodeStr;
}

// Persistent TCP Server function (runs in a thread)
void TCPServer()
{
    WSADATA wsaData;
    SOCKET serverSocket;
    struct sockaddr_in serverAddr;

    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
    {
        LogMessage("[DLL] WSAStartup failed!");
        return;
    }

    serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == INVALID_SOCKET)
    {
        LogMessage("[DLL] Socket creation failed!");
        WSACleanup();
        return;
    }

    // Bind
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(PORT);
    serverAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(serverSocket, (struct sockaddr *)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR)
    {
        LogMessage("[DLL] Bind failed! Port might be in use.");
        closesocket(serverSocket);
        WSACleanup();
        return;
    }

    // Listen
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR)
    {
        LogMessage("[DLL] Listen failed!");
        closesocket(serverSocket);
        WSACleanup();
        return;
    }

    serverRunning = true;
    LogMessage("[DLL] TCP Server Started!");

    clientSocket = accept(serverSocket, NULL, NULL);
    if (clientSocket == INVALID_SOCKET)
    {
        LogMessage("[DLL] Accept failed!");
        closesocket(serverSocket);
        WSACleanup();
        return;
    }
    LogMessage("[DLL] Client Connected.");

    char buffer[1024];
    while (serverRunning)
    {
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived > 0)
        {
            buffer[bytesReceived] = '\0';
            std::lock_guard<std::mutex> lock(messageMutex);
            latestMessage = buffer;
            LogMessage("[DLL] Received: " + latestMessage);

            // Respond back to Node.js
            std::string response = "[MQL] Processed: " + latestMessage;
            send(clientSocket, response.c_str(), response.size(), 0);
            LogMessage("[DLL] Sent to Node: " + response);
        }
        else if (bytesReceived == 0)
        {
            LogMessage("[DLL] Client disconnected.");
            break;
        }
    }

    closesocket(clientSocket);
    closesocket(serverSocket);
    WSACleanup();
    LogMessage("[DLL] TCP Server Stopped.");
}

// Start the TCP server (called from MQL5)
extern "C" __declspec(dllexport) int StartTCPServer()
{
    static bool serverStarted = false;
    if (!serverStarted)
    {
        std::thread serverThread(TCPServer);
        serverThread.detach();
        serverStarted = true;
        return 0;
    }
    return -1;
}

// Stop the TCP server (called from MQL5)
extern "C" __declspec(dllexport) int StopTCPServer()
{
    serverRunning = false;
    if (clientSocket != INVALID_SOCKET)
    {
        closesocket(clientSocket);
    }
    WSACleanup();
    LogMessage("[DLL] TCP Server Stopped.");
    return 0;
}

// Get the latest message (called from MQL5)
extern "C" __declspec(dllexport) const wchar_t *GetLatestMessage()
{
    static wchar_t buffer[1024];
    std::lock_guard<std::mutex> lock(messageMutex);
    std::wstring unicodeMessage = ANSItoUnicode(latestMessage);
    wcsncpy(buffer, unicodeMessage.c_str(), sizeof(buffer) / sizeof(buffer[0]) - 1);
    buffer[sizeof(buffer) / sizeof(buffer[0]) - 1] = L'\0';
    return buffer;
}

// Send message to Node.js (called from MQL5)
extern "C" __declspec(dllexport) int SendMessageToNode(const wchar_t *message)
{
    int len = WideCharToMultiByte(CP_ACP, 0, message, -1, NULL, 0, NULL, NULL);
    std::string ansiMessage(len, 0);
    WideCharToMultiByte(CP_ACP, 0, message, -1, &ansiMessage[0], len, NULL, NULL);

    std::string taggedMessage = "[MQL] " + ansiMessage;

    if (clientSocket != INVALID_SOCKET)
    {
        send(clientSocket, taggedMessage.c_str(), taggedMessage.size(), 0);
        LogMessage("[DLL] Sent to Node: " + taggedMessage);
        return 0;
    }
    else
    {
        LogMessage("[DLL] No active connection to Node.js!");
        return -1;
    }
}
