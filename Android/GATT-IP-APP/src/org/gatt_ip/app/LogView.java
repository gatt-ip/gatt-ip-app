package org.gatt_ip.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.text.method.ScrollingMovementMethod;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;

import org.gatt_ip.activity.R;

public class LogView extends Activity implements OnClickListener {
	
	private Button closeBtn,emailBtn;
	private TextView logView;
	String logData;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.logview);
		initializeViews();
		setListenersToViews();
		Bundle extras = getIntent().getExtras();
	    if (extras != null)
	    {
	    	logData = extras.getString("logCat");
	        logView.setText(logData);
	    }
			
	}
	
	// initialize views from xml
	private void initializeViews() {
		closeBtn = (Button) findViewById(R.id.closeBtn);
		emailBtn = (Button) findViewById(R.id.emailBtn);
		logView = (TextView) findViewById(R.id.logView);
		logView.setMovementMethod(new ScrollingMovementMethod());
	}
	
	// set listeners to it's views
	private void setListenersToViews() {
		closeBtn.setOnClickListener(this);
		emailBtn.setOnClickListener(this);
	}
		
	@Override
	public void onClick(View v) {
		// create websocket server on background,because network socket and
		// main application not run on the same thread
		int id = v.getId();
		if(id == R.id.closeBtn)
		{
			finish();
		} else if(id == R.id.emailBtn)
		{
			String version = "1.0";
		    String build = "100";
		    String model = android.os.Build.MANUFACTURER;
		    String androidVersion = android.os.Build.VERSION.RELEASE;
			String subject = "Readable Data - "+version+", "+build;
			StringBuilder supportText = new StringBuilder();
			supportText.append("Device: "+model);
			supportText.append(System.getProperty("line.separator"));
			supportText.append("Android Version: "+androidVersion);
			supportText.append(System.getProperty("line.separator"));
			supportText.append(System.getProperty("line.separator"));
			supportText.append("Please describe your problem or question.");
			supportText.append(System.getProperty("line.separator"));
			supportText.append(logData);
			Intent email = new Intent(Intent.ACTION_SEND);
			email.putExtra(Intent.EXTRA_SUBJECT, subject);
			email.putExtra(Intent.EXTRA_TEXT, new String(supportText));
			email.setType("message/rfc822");
			startActivity(Intent.createChooser(email, "Choose an Email client :"));
		}
	}

}
