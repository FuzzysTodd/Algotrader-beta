//+------------------------------------------------------------------+
//|                                                      ProjectName |
//|                                      Copyright 2020, CompanyName |
//|                                       http://www.companyname.net |
//+------------------------------------------------------------------+
#include <Trade\Trade.mqh>

#import "bridge.dll"
int StartTCPServer();
int StopTCPServer();
string GetLatestMessage();
string GetJsonFromNode();
void SendMessageToNode(string message);
#import

CTrade trade;

string activeSymbols[]; // List of currently subscribed symbols
string lastNonce = "";

struct SymbolConfig
  {
   string            symbol;
   double            GAP;
   double            ECLIPSE_BUFFER;
  };
SymbolConfig symbolConfigs[];

// ============================
// 📝 Trim Function
// ============================
string TrimString(string str)
  {
   while(StringLen(str) > 0 && StringGetCharacter(str, 0) == ' ')
      str = StringSubstr(str, 1);
   while(StringLen(str) > 0 && StringGetCharacter(str, StringLen(str) - 1) == ' ')
      str = StringSubstr(str, 0, StringLen(str) - 1);
   return str;
  }

// ============================
// 📝 JSON Extractor
// ============================
string GetJSONValue(string json, string key)
  {
   int keyStart = StringFind(json, "\"" + key + "\":");
   if(keyStart == -1)
      return "";

   int valueStart = StringFind(json, ":", keyStart) + 1;
   if(valueStart <= 0)
      return "";

   bool isString = StringGetCharacter(json, valueStart) == '\"';
   if(isString)
      valueStart++;

   int valueEnd = isString
                  ? StringFind(json, "\"", valueStart)
                  : StringFind(json, ",", valueStart);
   if(valueEnd == -1)
      valueEnd = StringFind(json, "}", valueStart);

   return TrimString(StringSubstr(json, valueStart, valueEnd - valueStart));
  }

// ============================
// 🔄 Close Existing Orders
// ============================
void CloseAllOrders(string symbol)
  {
   Print("CloseAllOrders symbol --->", symbol);
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      if(PositionGetSymbol(i) == symbol)
        {
         ulong ticket = PositionGetInteger(POSITION_TICKET);
         ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double price = (type == POSITION_TYPE_BUY) ? SymbolInfoDouble(symbol, SYMBOL_BID) : SymbolInfoDouble(symbol, SYMBOL_ASK);
         int slippage = 10;

         trade.PositionClose(ticket, slippage);
         Print("[MQL5] ✅ Closed previous trade on: " + symbol);
        }
     }
  }

// ============================
// 🛠 OnInit
// ============================
int OnInit()
  {
   Print("[MQL5] Starting TCP Server...");
   if(StartTCPServer() == 0)
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
// 📉 OnTick
// ============================
void OnTick()
  {
   string message = TrimString(GetLatestMessage());
   if(message == "NONE" || message == "")
      return;

   string json = TrimString(GetJsonFromNode());
   if(StringFind(json, "\"symbol\":") < 0)
      return;

   string symbol = GetJSONValue(json, "symbol");
   string action = GetJSONValue(json, "action");
   string nonce = GetJSONValue(json, "nonce");
   double GAP = StringToDouble(GetJSONValue(json, "GAP"));
   double ECLIPSE_BUFFER = StringToDouble(GetJSONValue(json, "ECLIPSE_BUFFER"));

   if(symbol == "")
      return;

   Print("action: -->>", action);

// 🧹 Handle UNSUBSCRIBE
   if(action == "UNSUBSCRIBE")
     {
      Print("[MQL5] 🔕 UNSUBSCRIBE received for symbol: ", symbol);
      CloseAllOrders(symbol);

      // Remove from activeSymbols array
      for(int i = 0; i < ArraySize(activeSymbols); i++)
        {
         if(activeSymbols[i] == symbol)
           {
            for(int j = i; j < ArraySize(activeSymbols) - 1; j++)
               activeSymbols[j] = activeSymbols[j + 1];
            ArrayResize(activeSymbols, ArraySize(activeSymbols) - 1);
            break;
           }
        }

      // Remove from symbolConfigs array
      for(int i = 0; i < ArraySize(symbolConfigs); i++)
        {
         if(symbolConfigs[i].symbol == symbol)
           {
            for(int j = i; j < ArraySize(symbolConfigs) - 1; j++)
               symbolConfigs[j] = symbolConfigs[j + 1];
            ArrayResize(symbolConfigs, ArraySize(symbolConfigs) - 1);
            break;
           }
        }

      return; // Exit early after unsubscribe
     }


// 🛑 Track symbol config
   bool exists = false;
   for(int i = 0; i < ArraySize(symbolConfigs); i++)
     {
      if(symbolConfigs[i].symbol == symbol)
        {
         exists = true;
         symbolConfigs[i].GAP = GAP;
         symbolConfigs[i].ECLIPSE_BUFFER = ECLIPSE_BUFFER;
         break;
        }
     }
   if(!exists)
     {
      ArrayResize(symbolConfigs, ArraySize(symbolConfigs) + 1);
      symbolConfigs[ArraySize(symbolConfigs) - 1].symbol = symbol;
      symbolConfigs[ArraySize(symbolConfigs) - 1].GAP = GAP;
      symbolConfigs[ArraySize(symbolConfigs) - 1].ECLIPSE_BUFFER = ECLIPSE_BUFFER;
      Print("[MQL5] Subscribed to symbol: " + symbol);

      ArrayResize(activeSymbols, ArraySize(activeSymbols) + 1);
      activeSymbols[ArraySize(activeSymbols) - 1] = symbol;
     }

// 📈 Get price
   double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double spread = ask - bid;
   double volume = StringToDouble(GetJSONValue(json, "volume"));

// 🚀 Send price data
   string payload = "{ \"symbol\": \"" + symbol + "\", \"bid\": " + DoubleToString(bid, 5) +
                    ", \"ask\": " + DoubleToString(ask, 5) + ", \"spread\": " + DoubleToString(spread, 5) +
                    ", \"GAP\": " + DoubleToString(GAP, 2) +
                    ", \"ECLIPSE_BUFFER\": " + DoubleToString(ECLIPSE_BUFFER, 2) + " }";
   SendMessageToNode(payload);

// ⚙️ Execute Trade
   bool shouldExecuteTrade = (action == "BUY" || action == "SELL") && nonce != "" && nonce != lastNonce;

   if(shouldExecuteTrade)
     {
      Print("[MQL5] 📥 Received trade action → ", action, " | Symbol: ", symbol);
      CloseAllOrders(symbol);

      MqlTradeRequest request;
      MqlTradeResult result;
      ZeroMemory(request);
      ZeroMemory(result);

      if (volume <= 0) volume = 0.1; 
      request.symbol = symbol;
      request.volume = volume;
      request.deviation = 10;
      request.magic = 123456;
      request.type_filling = ORDER_FILLING_IOC;
      request.action = TRADE_ACTION_DEAL;

      if(action == "BUY")
        {
         request.type = ORDER_TYPE_BUY;
         request.price = ask;
        }
      else
        {
         request.type = ORDER_TYPE_SELL;
         request.price = bid;
        }

      if(OrderSend(request, result) && result.retcode == TRADE_RETCODE_DONE)
        {
         Print("[MQL5] ✅ Trade executed → Ticket: ", result.order);
         lastNonce = nonce;
        }
      else
        {
         Print("[MQL5] ❌ Trade failed → Retcode: ", result.retcode, ", Comment: ", result.comment);
        }
     }
  }

// ============================
// 🧹 OnDeinit
// ============================
void OnDeinit(const int reason)
  {
   StopTCPServer();
   Print("[MQL5] TCP Server Stopped.");
  }
//+------------------------------------------------------------------+
