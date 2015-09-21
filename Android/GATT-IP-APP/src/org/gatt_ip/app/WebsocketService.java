package org.gatt_ip.app;

import android.content.Context;
import android.util.Log;
import org.gatt_ip.GATTIP;
import org.gatt_ip.GATTIPListener;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Random;

/**
 * Created by Ansari on 24/08/2015.
 */
public class WebsocketService extends WebSocketServer implements GATTIPListener {

    GATTIP gattip;
    public static WebSocket webSocket;
    Context ctx;

    public WebsocketService(InetSocketAddress address, Context ctx) {
        super(address);
        Log.v("socket address", "" + address);
        gattip = new GATTIP(ctx);
        gattip.setGATTIPListener(this);
        this.ctx = ctx;
    }

    public WebsocketService(Context ctx) throws UnknownHostException {
        super();
        gattip = new GATTIP(ctx);
        gattip.setGATTIPListener(this);
    }

    //call when user wants to close connection with client
    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        Log.v("GATTIPServer onClose","closed " + conn.getRemoteSocketAddress() + " with exit code " + code + " additional info: " + reason);
    }

    //method called when we got any interruption on connection
    @Override
    public void onError(WebSocket conn, Exception ex) {
        if(webSocket != null)
            webSocket = null;
        Log.v("GATTIPServer onError", "closed "+ex.getMessage());
    }

    //method called when we got request from client
    @Override
    public void onMessage(WebSocket conn, String message) {

        Log.v("GATTIPServer","received message from " + conn.getRemoteSocketAddress() + ": " + message);

        gattip.request(message);
    }

    //method called when we got connection request from client
    @Override
    public void onOpen(WebSocket conn, ClientHandshake handShake) {
        webSocket = conn;
        Log.v("GATTIPServer","connection to " + conn.getRemoteSocketAddress()+"/"+conn.getLocalSocketAddress());
    }

    @Override
    public void response(String gattipMsg) {
        if (webSocket != null) {
            try {
                webSocket.send(gattipMsg);
            } catch (Exception ec) {
                ec.printStackTrace();
            }
        }
    }

    public static int generateRandomPort() {
        Random random = new Random();
        int min = 1024;
        int max = 10024;
        int portNumber = random.nextInt(max-min+1) + min;
        if(portNumber < 1024 || portNumber > 65000)
            generateRandomPort();
        return portNumber;
    }
}
