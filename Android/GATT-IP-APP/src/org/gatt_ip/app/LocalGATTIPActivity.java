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

import org.gatt_ip.BluetoothLEService;
import org.gatt_ip.GATTIP;
import org.gatt_ip.activity.R;
import org.java_websocket.server.WebSocketServer;
import org.json.JSONObject;
import java.io.IOException;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.util.List;

import io.fabric.sdk.android.Fabric;

public class LocalGATTIPActivity extends Activity {

    private WebView mWebview;
    private Context ctx;
    public static LocalGATTIPActivity lActivity;
    static WebsocketService server;
    StartServerTask task;

    @JavascriptInterface
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Fabric.with(this, new Crashlytics());
        setContentView(R.layout.local_gattip);

        ctx = this;
        lActivity = this;
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

        initializeViews();

        Helper.configure();
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

    private class StartServerTask extends AsyncTask<String, Object, String> {
        @Override
        protected String doInBackground(String... params) {
            int portNumber = WebsocketService.generateRandomPort();
            server = new WebsocketService(new InetSocketAddress("localhost", portNumber), ctx);
            server.start();
            return "";
        }
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("LocalGATTIPActivity", "disconnect stick");

        if(server != null) {
            unbindService(server.gattip);

            try {
                server.stop();
            } catch (IOException ie) {
                ie.printStackTrace();
            } catch (InterruptedException ie) {
                ie.printStackTrace();
            }
        }

        try {
            ctx.stopService(new Intent(ctx, BluetoothLEService.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if(event.getAction() == KeyEvent.ACTION_DOWN){
            switch(keyCode) {
                case KeyEvent.KEYCODE_BACK:
                    if(mWebview.canGoBack()) {
                        mWebview.goBack();
                    } else {
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


     private class MyWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if(url.contains("remoteview")) {
                ctx.stopService(new Intent(ctx, BluetoothLEService.class));
                gotoRemote();
            } else if(url.contains("logview")) {
                gotoLog();
            }
            return true;
        }

        @TargetApi(Build.VERSION_CODES.KITKAT)
        @Override
        public void onPageFinished (WebView view, String url) {
            if(server != null) {
                int port = server.getPort();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    // In KitKat+ you should use the evaluateJavascript method
                    view.evaluateJavascript("connectWithPort(" + port + ")", new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String s) {
                            JsonReader reader = new JsonReader(new StringReader(s));
                            // Must set lenient to parse single values
                            reader.setLenient(true);
                            try {
                                if (reader.peek() != JsonToken.NULL) {
                                    if (reader.peek() == JsonToken.STRING) {
                                        reader.nextString();
                                    }
                                }
                            } catch (IOException e) {
                                e.printStackTrace();
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
        }

        public void gotoRemote() {
            Intent intent = new Intent(ctx, RemoteGATTIPActivity.class);
            startActivity(intent);
        }

        public void gotoLog() {
            Intent intent = new Intent(ctx, LogView.class);
            StringBuilder logCat = new StringBuilder();
            List<JSONObject> previousRequests = null;
            previousRequests = Helper.listOFResponseAndRequests();

            if(previousRequests != null && previousRequests.size() > 0) {
                for(int i=0 ; i<previousRequests.size();i++) {
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
    }
}
