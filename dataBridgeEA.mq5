#import "bridge.dll"
   int StartTCPServer();
   int StopTCPServer();
   string GetLatestMessage();
   void SendMessageToNode(string message);
#import

string lastMessage = "";

// ============================
// 📝 Initialize server
// ============================
int OnInit()
{
   Print("[MQL5] Starting TCP Server...");
   if (StartTCPServer() == 0)
   {
      Print("[MQL5] TCP Server Started!");
   }
   else
   {
      Print("[MQL5] Failed to start TCP Server.");
      return INIT_FAILED;
   }
   return INIT_SUCCEEDED;
}

// ============================
// 📝 Handle incoming messages & forward response
// ============================
void OnTick()
{
   string message = GetLatestMessage();
   if (message != "" && message != lastMessage)
   {
      lastMessage = message;
      Print("[MQL5] Received from DLL: ", message);

      // Send a new response back to Node.js
      string response = "[MQL] Processed: " + message;
      SendMessageToNode(response);
      Print("[MQL5] Sent response: ", response);
   }
}

// ============================
// 📝 Cleanup when EA is removed
// ============================
void OnDeinit(const int reason)
{
   StopTCPServer();
   Print("[MQL5] TCP Server Stopped.");
}
