#import "bridge.dll"
   int StartTCPServer();
   int StopTCPServer();
   string GetLatestMessage();
   void SendMessageToNode(string message);
#import

string activeSymbols[];

// ============================
// 📝 Initialize server
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
void OnTick()
{
   string subscribedSymbols = GetLatestMessage();
   if (subscribedSymbols == "NONE" || subscribedSymbols == "")
   {
      return; 
   }

   string symbolsArray[];
   StringSplit(subscribedSymbols, ';', symbolsArray);

   for (int i = 0; i < ArraySize(symbolsArray); i++)
   {
      string symbol = symbolsArray[i];
      if (symbol != "" && SymbolSelect(symbol, true))  
      {
         double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
         string message = symbol + ": " + DoubleToString(bid, 5);
         SendMessageToNode(message);
         Print("[MQL5] Sending price update: " + message);
      }
   }
}


// ============================
// 📝 Subscribe or Unsubscribe symbols
// ============================
void ManageSubscription(string command, string symbol) {
   if (command == "SUBSCRIBE") {
      ArrayResize(activeSymbols, ArraySize(activeSymbols) + 1);
      activeSymbols[ArraySize(activeSymbols) - 1] = symbol;
   } else if (command == "UNSUBSCRIBE") {
      for (int i = 0; i < ArraySize(activeSymbols); i++) {
         if (activeSymbols[i] == symbol) {
            ArrayRemove(activeSymbols, i);
            break;
         }
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
