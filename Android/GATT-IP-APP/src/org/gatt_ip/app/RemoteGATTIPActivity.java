package org.gatt_ip.app;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.gatt_ip.GATTIP;
import org.gatt_ip.GATTIPListener;
import org.gatt_ip.activity.R;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONObject;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class RemoteGATTIPActivity extends Activity implements OnClickListener {
	public static Runnable runnable;
	private Context ctx;
	StartServerTask task;
	StopServerTask stopTask;
	Button connectBtn, localBtn, logBtn;
	EditText editText;
	WebSocketClient client;
	String url,state;
	public GATTIP gattip;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.remote_gattip);
		ctx = this;
		initializeViews();
		setListenersToViews();
		editText.setText("ws://app.vensiconnect.com:3037");
		InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
		imm.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT);
	}

	// initialize views from xml
	private void initializeViews() {
		connectBtn = (Button) findViewById(R.id.connectBtn);
		localBtn = (Button) findViewById(R.id.localBtn);
		editText = (EditText) findViewById(R.id.socket_address);
		logBtn = (Button) findViewById(R.id.logBtn);
	}

	// set listeners to it's views
	private void setListenersToViews() {
		connectBtn.setOnClickListener(this);
		localBtn.setOnClickListener(this);
		logBtn.setOnClickListener(this);
	}

	@Override
	public void onClick(View v) {
		// create websocket server on background,because network socket and
		// main application not run on the same thread
		int id = v.getId();
		if (id == R.id.connectBtn) {
			state = connectBtn.getText().toString();
			url = editText.getText().toString();
			if(state.equals("Connect"))
			{
			if (url.isEmpty()) {
				Toast toast = Toast.makeText(ctx,"Please enter Host Name or IP address.",Toast.LENGTH_SHORT);
				toast.show();
				return;
			} else if(!validateUrl(url)) {
				Toast toast = Toast.makeText(ctx,"Invalid Address. Please enter a valid HOST or IP Address",Toast.LENGTH_SHORT);
				toast.show();
				return;
			} else if (!isNetworkAvailable()) {
				Toast toast = Toast.makeText(ctx,"There is no network, which is required to connect to the remote server.",Toast.LENGTH_SHORT);
				toast.show();
				return;
			}
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
			} else if(state.equals("Disconnect"))
			{
				stopTask = new StopServerTask();
				try {
					// Async task to start web socket server
					stopTask = new StopServerTask();
					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB)
						stopTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, "");
					else
						stopTask.execute("");
				} catch (Exception ex) {
					ex.printStackTrace();
				}
			}
		} else if (id == R.id.localBtn) {
			gotoLocal();
		} else if (id == R.id.logBtn) {
			gotoLog();
		}
	}
	
	public void gotoLocal()
	{
		finish();
	}
	
	public void gotoLog()
	{
		Intent intent = new Intent(ctx, LogView.class);	
		StringBuilder logCat = new StringBuilder();;
		List<JSONObject> previousRequests = gattip.listOFResponseAndRequests();
		if(previousRequests != null && previousRequests.size() !=0)
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

	private boolean isNetworkAvailable() {
		ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
		return activeNetworkInfo != null && activeNetworkInfo.isConnected();
	}
	
	private static boolean validateUrl(String candidate) {
        try {
        	String pattern = "(ws|wss)://((\\w)*|([0-9]*)|([-|_])*)+([\\.|:]((\\w)*|([0-9]*)|([-|_])*))+";
            Pattern patt = Pattern.compile(pattern);
            Matcher matcher = patt.matcher(candidate);
            return matcher.matches();
        } catch (RuntimeException e) {
          return false;
        }  
    }

	private class StartServerTask extends AsyncTask<String, Object, String> {
		@Override
		protected String doInBackground(String... params) {
			try {
				if (url != null) {
					client = new GATTIPClient(new URI(url), ctx);
					client.connect();
				}
			} catch (URISyntaxException e) {
				e.printStackTrace();
			}
			return "";
		}
	}

	private class StopServerTask extends AsyncTask<String, Object, String> {
		@Override
		protected String doInBackground(String... params) {
		    client.close();
			return "";
		}
	}
	
	public class GATTIPClient extends WebSocketClient implements GATTIPListener {

		public GATTIPClient(URI serverUri, Draft draft) {
			super(serverUri, draft);
		}

		public GATTIPClient(URI serverURI, Context ctx) {
			super(serverURI);
			gattip = new GATTIP(ctx);
			gattip.setGATTIPListener(this);
		}

		@Override
		public void onOpen(ServerHandshake handshakedata) {
			runOnUiThread(new Runnable() {
				@Override
				public void run() {
					// stop screen from sleeping
					getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
					Toast toast = Toast.makeText(ctx, "Connected Successfully",Toast.LENGTH_SHORT);
					toast.show();
					connectBtn.setTextColor(ctx.getResources().getColor(R.color.orange));
					connectBtn.setText("Disconnect");
				}
			});
		}

		@Override
		public void onClose(int code, String reason, boolean remote) {
			Log.v("GATTIPClient", "closed with exit code " + code+ " additional info: " + reason);
			runOnUiThread(new Runnable() {
				@Override
				public void run() {
					// stop screen from sleeping
					getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
					Toast toast = Toast.makeText(ctx,"Conection closed.",Toast.LENGTH_SHORT);
					toast.show();
					connectBtn.setTextColor(ctx.getResources().getColor(R.color.bgblue));
					connectBtn.setText("Connect");
				}
			});
		}

		@Override
		public void onMessage(String message) {
			Log.v("GATTIPClient", "received message: " + message);
			gattip.request(message);
		}

		@Override
		public void onError(Exception ex) {
			Log.v("GATTIPClient", "an error occured:" + ex);
			runOnUiThread(new Runnable() {
				@Override
				public void run() {
					// stop screen from sleeping
					getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
					Toast toast = Toast.makeText(ctx,"An error occured. Please try again",Toast.LENGTH_SHORT);
					toast.show();
					connectBtn.setTextColor(ctx.getResources().getColor(R.color.bgblue));
					connectBtn.setText("Connect");
				}
			});
		}

		@Override
		public void response(String gattipMsg) {
			client.send(gattipMsg);
		}
	}

}
