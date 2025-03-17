## Compile the c++ code.
g++ -shared -o ForexDataBridge.dll ForexDataBridge.cpp -lws2_32 -lbcrypt
------------------------------------------------------------------------

## MT5 Websocket connection steps:
------------------------------------------------------------------------

🏗️ 1. Place the DLL in the correct directory: MetaTrader 5 > MQL5 > Libraries
📋 2. Create an MQL5 Expert Advisor: MetaTrader 5 > Tools > MetaQuotes Language Editor > Give it a name like `ForexDataBridgeEA`
📌 3. Write the MQL5 EA code:
⚙️ 4. Attach the EA to a Chart:
✅ 5. Enable Algo Trading:
📡 6. Verify the Connection with Node.js or Expert panel: MetaTrader 5 > View > Toolbox