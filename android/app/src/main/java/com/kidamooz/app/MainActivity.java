package com.kidamooz.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OtpReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
