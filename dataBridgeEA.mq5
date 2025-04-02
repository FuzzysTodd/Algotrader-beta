#import "bridge.dll"
   int StartTCPServer();
   int StopTCPServer();
   string GetLatestMessage();
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
   string subscribedSymbols = GetLatestMessage();
   subscribedSymbols = TrimString(subscribedSymbols); // Remove extra spaces

   if (subscribedSymbols == "NONE" || subscribedSymbols == "") {
      return; 
   }

   string symbolsArray[];
   int count = StringSplit(subscribedSymbols, ';', symbolsArray);

   for (int i = 0; i < count; i++) {
      string symbol = TrimString(symbolsArray[i]);
      if (symbol == "") continue; // Ignore empty symbols

      // Add to activeSymbols if not already subscribed
      bool isNewSubscription = true;
      for (int j = 0; j < ArraySize(activeSymbols); j++) {
         if (activeSymbols[j] == symbol) {
            isNewSubscription = false;
            break;
         }
      }

      if (isNewSubscription) {
         Print("[MQL5] Subscribed to symbol: " + symbol);
         ArrayResize(activeSymbols, ArraySize(activeSymbols) + 1);
         activeSymbols[ArraySize(activeSymbols) - 1] = symbol;
      }

      // Fetch market data
      double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
      double spread = ask - bid;

      // Send price update in JSON format
      string message = "{ \"symbol\": \"" + symbol + "\", \"bid\": " + DoubleToString(bid, 5) + ", \"ask\": " + DoubleToString(ask, 5) + ", \"spread\": " + DoubleToString(spread, 5) + " }";
      SendMessageToNode(message);
      Print("[MQL5] Sending price update: " + message);
   }

   // Check for unsubscriptions
   int activeSize = ArraySize(activeSymbols);
   for (int i = activeSize - 1; i >= 0; i--) {
      bool found = false;
      for (int j = 0; j < count; j++) {
         if (activeSymbols[i] == TrimString(symbolsArray[j])) {
            found = true;
            break;
         }
      }

      if (!found) {
         Print("[MQL5] Unsubscribed from symbol: " + activeSymbols[i]);

         // Remove the symbol by shifting elements
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
