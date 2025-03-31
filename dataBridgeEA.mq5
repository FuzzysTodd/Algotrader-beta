#import "bridge.dll"
   int StartTCPServer();
   void SendPriceUpdate(string message);
#import

string lastPrices[];
string activeSymbols[];

int OnInit() {
   Print("[MQL5] Starting TCP Server...");
   StartTCPServer();
   return INIT_SUCCEEDED;
}

// Monitor price changes
void OnTick() {
   for (int i = 0; i < ArraySize(activeSymbols); i++) {
      string symbol = activeSymbols[i];
      double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);

      string newPrice = symbol + "," + DoubleToString(bid, 5) + "," + DoubleToString(ask, 5);
      
      if (newPrice != lastPrices[i]) {
         lastPrices[i] = newPrice;
         string message = "{\"symbol\":\"" + symbol + "\", \"bid\":" + DoubleToString(bid, 5) + ", \"ask\":" + DoubleToString(ask, 5) + "}";
         SendPriceUpdate(message);
      }
   }
}

// Handle server stop
void OnDeinit(const int reason) {
   Print("[MQL5] TCP Server Stopped.");
}
