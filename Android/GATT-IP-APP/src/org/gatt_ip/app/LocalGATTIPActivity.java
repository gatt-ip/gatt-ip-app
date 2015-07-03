package org.gatt_ip.app;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothGatt;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.crashlytics.android.Crashlytics;

import org.gatt_ip.BluetoothService;
import org.gatt_ip.GATTIP;
import org.gatt_ip.GATTIPListener;
import org.gatt_ip.activity.R;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.json.JSONObject;

import java.io.IOException;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import io.fabric.sdk.android.Fabric;

public class LocalGATTIPActivity extends Activity {
    StartServerTask task;
    private WebView mWebview;
    private Context ctx;
    public static LocalGATTIPActivity lActivity;
    WebSocketServer server;
    public GATTIP gattip;

    //@SuppressLint("SetJavaScriptEnabled")
    @JavascriptInterface
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Fabric.with(this, new Crashlytics());
        setContentView(R.layout.local_gattip);
        ctx = this;
        lActivity = this;

        initializeViews();
        // create websocket server on background,because network socket and
        // main application not run on the same thread
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
        // adding web view to show html files
        WebSettings settings = mWebview.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setBuiltInZoomControls(true);
        // disable zoom to webview
        settings.setSupportZoom(false);
        mWebview.requestFocusFromTouch();
        mWebview.setWebViewClient(new MyWebViewClient());
        mWebview.setWebChromeClient(new WebChromeClient());
        mWebview.addJavascriptInterface(lActivity,"AndroidFunction");
        // load web view by using html file to establish connection with server
        // here web view treated as web socket client
        mWebview.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("ondestroy","disconnect stick");

        if(gattip != null) {
            ArrayList<BluetoothGatt> connectedDevices = gattip.getConnectedDevices();

            if (connectedDevices != null) {
                Log.d("connected devices", "" + connectedDevices.size());

                for (BluetoothGatt gatt : connectedDevices) {
                    gatt.disconnect();
                }
            }
        }
        if(server != null) {
            try {
                server.stop();
            } catch (IOException ie) {
                ie.printStackTrace();
            } catch (InterruptedException ie) {
                ie.printStackTrace();
            }
        }

        try {
            ctx.stopService(new Intent(ctx, BluetoothService.class));
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if(event.getAction() == KeyEvent.ACTION_DOWN){
            switch(keyCode)
            {
                case KeyEvent.KEYCODE_BACK:
                    if(mWebview.canGoBack())
                    {
                        mWebview.goBack();
                    }else{
                        showAlert();
                    }
                    return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    // initialize views from xml
    private void initializeViews() {
        mWebview = (WebView) findViewById(R.id.webview);
    }

    public void showAlert() {
        AlertDialog.Builder adb = new AlertDialog.Builder(this);
        adb.setMessage("Do you want to close GATT-IP app?");

        adb.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                finish();
            } });
        adb.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {

            } });
        adb.show();
    }

/*
    @Override
	protected void onSaveInstanceState(Bundle outState)
	{
	   super.onSaveInstanceState(outState);
	   mWebview.saveState(outState);
	}
	   
	@Override
	protected void onRestoreInstanceState(Bundle savedInstanceState)
	{
	   super.onRestoreInstanceState(savedInstanceState);
	   mWebview.restoreState(savedInstanceState);
	}
*/

    private class StartServerTask extends AsyncTask<String, Object, String> {
        @Override
        protected String doInBackground(String... params) {
            int portNumber = generateRandomPort();
            server = new GATTIPServer(new InetSocketAddress("localhost", portNumber), ctx);
            server.start();
            return "";
        }
    }

    public int generateRandomPort() {
        Random random = new Random();
        int min = 1024;
        int max = 10024;
        int portNumber = random.nextInt(max-min+1) + min;
        if(portNumber < 1024 || portNumber > 65000)
            generateRandomPort();
        return portNumber;
    }

    private class MyWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if(url.contains("remoteview"))
            {
                gotoRemote();
            } else if(url.contains("logview"))
            {
                gotoLog();
            }
            return true;
        }

        @TargetApi(Build.VERSION_CODES.KITKAT)
        @Override
        public void onPageFinished (WebView view, String url)
        {
            int port = server.getPort();
            Log.v("port number",""+port);
            if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                // In KitKat+ you should use the evaluateJavascript method
                view.evaluateJavascript("connectWithPort("+port+")", new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String s) {
                        JsonReader reader = new JsonReader(new StringReader(s));
                        // Must set lenient to parse single values
                        reader.setLenient(true);
                        try {
                            if(reader.peek() != JsonToken.NULL) {
                                if(reader.peek() == JsonToken.STRING) {
                                    reader.nextString();
                                }
                            }
                        } catch (IOException e) {
                            Log.e("TAG", "MainActivity: IOException", e);
                        } finally {
                            try {
                                reader.close();
                            } catch (IOException e) {

                            }
                        }
                    }
                });
            }
        }

        public void gotoRemote()
        {
            Intent intent = new Intent(ctx, RemoteGATTIPActivity.class);
            startActivity(intent);
        }

        public void gotoLog()
        {
            Intent intent = new Intent(ctx, LogView.class);
            StringBuilder logCat = new StringBuilder();;
            List<JSONObject> previousRequests = null;
            if(gattip != null) {
                previousRequests = gattip.listOFResponseAndRequests();
            }
            if(previousRequests != null && previousRequests.size() > 0)
            {
                for(int i=0 ; i<previousRequests.size();i++)
                {
                    logCat.append(previousRequests.get(i));
                    logCat.append(System.getProperty("line.separator"));
                    logCat.append("------------------------------------");
                    logCat.append(System.getProperty("line.separator"));
                }
                intent.putExtra("logCat", new String(logCat));
            }else
                intent.putExtra("logCat", "");
            startActivity(intent);
        }
    }

    public class GATTIPServer extends WebSocketServer implements GATTIPListener {
        private WebSocket webSocket;
        public GATTIPServer(InetSocketAddress address, Context ctx) {
            super(address);
            Log.v("socket address",""+address);
            gattip = new GATTIP(ctx);
            gattip.setGATTIPListener(this);
        }

        public GATTIPServer(Context ctx) throws UnknownHostException {
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
            Log.v("GATTIPServer onError","closed "+ex.getMessage());
        }

        //method called when we got request from client
        @Override
        public void onMessage(WebSocket conn, String message) {
            if(webSocket != null)
                webSocket = null;
            //Log.v("GATTIPServer","received message from " + conn.getRemoteSocketAddress() + ": " + message);
            webSocket = conn;
            gattip.request(message);
        }

        //method called when we got connection request from client
        @Override
        public void onOpen(WebSocket conn, ClientHandshake handShake) {
            Log.v("GATTIPServer","connection to " + conn.getRemoteSocketAddress());
        }

        @Override
        public void response(String gattipMsg) {
            Log.v("response", gattipMsg);
            /*try {
                Log.v("response",gattipMsg);
                JSONObject response  = new JSONObject(gattipMsg);
                if(response.getString(Constants.kResult).equals(Constants.kCentralState))
                {
                    JSONObject parameters = response.getJSONObject(Constants.kParams);
                    String stateString = parameters.getString(Constants.kState);
                    if(stateString.equals(Constants.kPoweredOff))
                    {
                        Intent enableBluetoothIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                        startActivityForResult(enableBluetoothIntent, 1);
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }*/
            if (webSocket != null)
            {
                try {
                    webSocket.send(gattipMsg);
                } catch (Exception ec) {
                    ec.printStackTrace();
                }
            }
        }
    }

}
