package org.gatt_ip.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.os.AsyncTask;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import org.gatt_ip.BluetoothLEService;
import org.gatt_ip.GATTIP;
import org.gatt_ip.activity.R;
import org.java_websocket.WebSocket;
import org.java_websocket.server.WebSocketServer;
import org.json.JSONObject;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import android.util.Log;


public class RemoteGATTIPActivity extends Activity implements OnClickListener{
    static WebSocketServer server;
    private Context ctx;
    Button localBtn, logBtn;
    TextView ip, portNo;
    public GATTIP gattip;
    StartServerTask task;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.remote_gattip);
        ctx = getApplicationContext();
        Helper.configure();
        initializeViews();
        setListenersToViews();
        getIPAddress();
        ctx.registerReceiver(this.wifiInfoReciever, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));

        gattip = new GATTIP(ctx);

        this.bindService(new Intent(this.getApplicationContext(), BluetoothLEService.class), gattip, 0);
        this.startService(new Intent(this.getApplicationContext(), BluetoothLEService.class));


        task = new StartServerTask();
        try {
            // Async task to start web socket server
            task = new StartServerTask();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB)
                task.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, "");
            else
                task.execute("");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private class StartServerTask extends AsyncTask<String, Object, String> {
        @Override
        protected String doInBackground(String... params) {
            int portNumber = 0;
            if(WebsocketService.webSocket != null)
                portNumber = WebsocketService.webSocket.getLocalSocketAddress().getPort();
            else
                portNumber = WebsocketService.generateRandomPort();

            server = new WebsocketService(new InetSocketAddress(getIPAddress(), portNumber), ctx);
            server.start();

            return "";
        }
        @Override
        protected void onPostExecute(String result) {
            portNo.setText("Port Number : " + server.getPort());
        }
    }

    // initialize views from xml
    private void initializeViews() {
        localBtn = (Button) findViewById(R.id.localBtn);
        logBtn = (Button) findViewById(R.id.logBtn);
        ip = (TextView) findViewById(R.id.ipAddress);
        ip.setText("IP Address : "+getIPAddress());
        portNo = (TextView) findViewById(R.id.port);
    }

    // set listeners to it's views
    private void setListenersToViews() {
        localBtn.setOnClickListener(this);
        logBtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        int id = v.getId();
        if (id == R.id.localBtn) {
            stopServer();
            if(WebsocketService.webSocket != null)
                WebsocketService.webSocket.close(WebsocketService.webSocket.getLocalSocketAddress().getPort());

            ctx.stopService(new Intent(ctx, BluetoothLEService.class));

            gotoLocal();
        } else if (id == R.id.logBtn) {
            gotoLog();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("RemoteGATTIPActivity","disconnect stick");

        unbindService(gattip);

        stopServer();

        try {
            ctx.stopService(new Intent(ctx, BluetoothLEService.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
        ctx.unregisterReceiver(wifiInfoReciever);
    }

    public void gotoLocal() {
        Intent intent = new Intent(ctx, LocalGATTIPActivity.class);
        startActivity(intent);
    }

    public void gotoLog() {
        Intent intent = new Intent(ctx, LogView.class);
        StringBuilder logCat = new StringBuilder();
        List<JSONObject> previousRequests = null;
        previousRequests = Helper.listOFResponseAndRequests();
        if (previousRequests != null && previousRequests.size() > 0) {
            for (int i = 0; i < previousRequests.size(); i++) {
                logCat.append(previousRequests.get(i));
                logCat.append(System.getProperty("line.separator"));
                logCat.append("------------------------------------");
                logCat.append(System.getProperty("line.separator"));
            }
            intent.putExtra("logCat", new String(logCat));
        } else {
            intent.putExtra("logCat", "");
        }
        startActivity(intent);
    }

    public void stopServer() {
        if(server != null) {
            try {
                server.stop();
            } catch (IOException ie) {
                ie.printStackTrace();
            } catch (InterruptedException ie) {
                ie.printStackTrace();
            }
        }
    }

    BroadcastReceiver wifiInfoReciever = new BroadcastReceiver(){
        @Override
        public void onReceive(Context context, Intent intent) {
            NetworkInfo networkInfo = intent.getParcelableExtra(ConnectivityManager.EXTRA_NETWORK_INFO);
            if(networkInfo.getType()== ConnectivityManager.TYPE_WIFI ||networkInfo.getType()== ConnectivityManager.TYPE_MOBILE ||networkInfo.getType()== ConnectivityManager.TYPE_BLUETOOTH){
                getIPAddress();
            }
        }
    };

    public String getIPAddress() {
        WifiManager myWifiManager = (WifiManager)getSystemService(Context.WIFI_SERVICE);
        WifiInfo myWifiInfo = myWifiManager.getConnectionInfo();
        int myIp = myWifiInfo.getIpAddress();
        String finalIPAddress = String.format("%d.%d.%d.%d", (myIp & 0xff), (myIp >> 8 & 0xff), (myIp >> 16 & 0xff), (myIp >> 24 & 0xff));
        return finalIPAddress;
    }
}
