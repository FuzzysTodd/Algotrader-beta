#import "bridge.dll"
   int StartTCPServer();
   int StopTCPServer();
   string GetLatestMessage();
   string GetJsonFromNode(); // NEW: Full JSON from Node.js
   void SendMessageToNode(string message);
#import

string activeSymbols[];

// ============================
// 📝 Trim Function (Removes Extra Spaces)
// ============================
string TrimString(string str) {
   while (StringGetCharacter(str, 0) == ' ') str = StringSubstr(str, 1);
   while (StringGetCharacter(str, StringLen(str) - 1) == ' ') str = StringSubstr(str, 0, StringLen(str) - 1);
   return str;
}

// ============================
// 📝 Initialize Server
// ============================
int OnInit() {
   Print("[MQL5] Starting TCP Server...");
   if (StartTCPServer() == 0) {
      Print("[MQL5] TCP Server Started!");
   } else {
      Print("[MQL5] Failed to start TCP Server.");
      return INIT_FAILED;
   }
   return INIT_SUCCEEDED;
}

// ============================
// 📝 Handle price updates for subscribed symbols
// ============================
void OnTick() {
   string message = GetLatestMessage();
   message = TrimString(message); // Example: "XAUUSD;EURUSD"

   if (message == "NONE" || message == "") return;

   string json = GetJsonFromNode(); // 🔄 Pull full JSON with GAP, ECLIPSE_BUFFER
   json = TrimString(json);

   if (StringFind(json, "\"symbol\":") < 0) return;

   string symbol = GetJSONValue(json, "symbol");
   double GAP = StringToDouble(GetJSONValue(json, "GAP"));
   double ECLIPSE_BUFFER = StringToDouble(GetJSONValue(json, "ECLIPSE_BUFFER"));

   if (symbol == "") return;

   // Add to activeSymbols if not already subscribed
   bool isNewSubscription = true;
   for (int i = 0; i < ArraySize(activeSymbols); i++) {
      if (activeSymbols[i] == symbol) {
         isNewSubscription = false;
         break;
      }
   }

   if (isNewSubscription) {
      Print("[MQL5] Subscribed to symbol: " + symbol);
      ArrayResize(activeSymbols, ArraySize(activeSymbols) + 1);
      activeSymbols[ArraySize(activeSymbols) - 1] = symbol;
   }

   // Fetch price
   double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double spread = ask - bid;

   // Send price update to Node.js
   string updatedMessage = "{ \"symbol\": \"" + symbol + "\", \"bid\": " + DoubleToString(bid, 5) +
                           ", \"ask\": " + DoubleToString(ask, 5) + ", \"spread\": " + DoubleToString(spread, 5) +
                           ", \"GAP\": " + DoubleToString(GAP, 2) + ", \"ECLIPSE_BUFFER\": " + DoubleToString(ECLIPSE_BUFFER, 2) + " }";

   SendMessageToNode(updatedMessage);
   Print("[MQL5] Sending price update: " + updatedMessage);

   // Unsubscription logic
   string subscribedSymbols[];
   int count = StringSplit(message, ';', subscribedSymbols);

   int activeSize = ArraySize(activeSymbols);
   for (int i = activeSize - 1; i >= 0; i--) {
      bool found = false;
      for (int j = 0; j < count; j++) {
         if (activeSymbols[i] == TrimString(subscribedSymbols[j])) {
            found = true;
            break;
         }
      }
      if (!found) {
         Print("[MQL5] Unsubscribed from symbol: " + activeSymbols[i]);

         // Remove from array
         for (int k = i; k < activeSize - 1; k++) {
            activeSymbols[k] = activeSymbols[k + 1];
         }
         ArrayResize(activeSymbols, activeSize - 1);
         activeSize--;
      }
   }
}

// ============================
// 📝 Cleanup when EA is removed
// ============================
void OnDeinit(const int reason) {
   StopTCPServer();
   Print("[MQL5] TCP Server Stopped.");
}

// ============================
// 📝 Function to Extract JSON Value
// ============================
string GetJSONValue(string json, string key) {
   int keyStart = StringFind(json, "\"" + key + "\":");
   if (keyStart == -1) return "";

   int valueStart = StringFind(json, ":", keyStart) + 1;

   bool isString = StringGetCharacter(json, valueStart) == '\"';
   if (isString) valueStart++;

   int valueEnd = isString
                  ? StringFind(json, "\"", valueStart)
                  : StringFind(json, ",", valueStart);
   if (valueEnd == -1) valueEnd = StringFind(json, "}", valueStart);

   return StringSubstr(json, valueStart, valueEnd - valueStart);
}
