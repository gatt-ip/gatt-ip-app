package org.gatt_ip.app;

import org.gatt_ip.util.Util;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Created by admin on 9/12/15.
 */
public class Helper {

    private static List<JSONObject> previousRequests;
    private static final int MAX_NUMBER_OF_REQUESTS = 60;

    public static void configure() {
        previousRequests = new ArrayList<JSONObject>();
    }

    /**
     * Handles logging of Requests and Responses including releasing the oldest
     * 25% of the Requests/Respnoses if/when the buffer overflows
     *
     * @param input  Response/Request
     */
    public static void handleLoggingRequestAndResponse(JSONObject input) {

        if(previousRequests != null)
        {
            if(previousRequests.size() > MAX_NUMBER_OF_REQUESTS)
            {
                for(int i=0;i<MAX_NUMBER_OF_REQUESTS/4.0;i++)
                {
                    previousRequests.remove(i);
                }
            }
            previousRequests.add(convertToHumanReadableFormat(input));
        }
    }

    public static JSONObject convertToHumanReadableFormat(JSONObject input) {
        JSONObject outputRespnose = new JSONObject();
        String humanReadableKey;
        @SuppressWarnings("unchecked")
        Iterator<String> allKeys = input.keys();
        List<String> keys = new ArrayList<String>();

        while (allKeys.hasNext()) {
            keys.add(allKeys.next());
        }

        for (String key : keys) {
            humanReadableKey = Util.humanReadableFormatFromHex(key);

            try {
                Object inputobj = input.get(key);

                if (inputobj instanceof String) {
                    String value = input.getString(key);
                    String humanReadableValue = Util.humanReadableFormatFromHex(value);

                    outputRespnose.put(humanReadableKey, humanReadableValue);
                } else if (inputobj instanceof JSONObject) {
                    JSONObject value = (JSONObject) input.get(key);
                    JSONObject humanReadableValue = convertToHumanReadableFormat(value);

                    outputRespnose.put(humanReadableKey, humanReadableValue);
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return outputRespnose;
    }

    public static List<JSONObject> listOFResponseAndRequests() {
        return previousRequests;
    }

    public static void addMessagesToLog(String message) {
        try {
            JSONObject request = new JSONObject(message);
            Helper.handleLoggingRequestAndResponse(request);
        } catch(JSONException je) {
            je.printStackTrace();
        }
    }
}
