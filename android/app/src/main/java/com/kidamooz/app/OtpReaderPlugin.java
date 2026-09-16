package com.kidamooz.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OtpReader")
public class OtpReaderPlugin extends Plugin {
    private static final Pattern SIX_DIGIT_CODE = Pattern.compile("(?<!\\d)(\\d{6})(?!\\d)");
    private BroadcastReceiver receiver;
    private PluginCall pendingCall;

    @PluginMethod
    public void start(PluginCall call) {
        stopListening("OTP listener replaced");
        pendingCall = call;
        registerReceiver();
        // User Consent works for APKs signed with a different certificate and
        // for provider messages that append mandatory text after the template.
        SmsRetriever.getClient(getActivity()).startSmsUserConsent(null)
            .addOnFailureListener(error -> finishWithError("OTP listener unavailable"));
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopListening("OTP listener stopped");
        call.resolve();
    }

    private void registerReceiver() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction()) || pendingCall == null) return;
                Status status = intent.getParcelableExtra(SmsRetriever.EXTRA_STATUS);
                if (status == null) {
                    finishWithError("OTP status missing");
                    return;
                }
                if (status.getStatusCode() == CommonStatusCodes.TIMEOUT) {
                    finishWithError("OTP listener timed out");
                    return;
                }
                if (status.getStatusCode() != CommonStatusCodes.SUCCESS) {
                    finishWithError("OTP listener failed");
                    return;
                }
                String message = intent.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
                if (message != null) {
                    resolveMessage(message);
                    return;
                }
                Intent consentIntent = intent.getParcelableExtra(SmsRetriever.EXTRA_CONSENT_INTENT);
                if (consentIntent == null) {
                    finishWithError("OTP consent unavailable");
                    return;
                }
                try {
                    startActivityForResult(pendingCall, consentIntent, "handleSmsConsentResult");
                } catch (ActivityNotFoundException error) {
                    finishWithError("OTP consent unavailable");
                }
            }
        };
        IntentFilter filter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
        ContextCompat.registerReceiver(
            getContext(), receiver, filter, SmsRetriever.SEND_PERMISSION, null, ContextCompat.RECEIVER_EXPORTED
        );
    }

    @ActivityCallback
    private void handleSmsConsentResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            finishWithError("OTP consent denied");
            return;
        }
        resolveMessage(result.getData().getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE));
    }

    private void resolveMessage(String message) {
        PluginCall call = pendingCall;
        pendingCall = null;
        unregisterReceiver();
        if (call == null) return;
        Matcher match = SIX_DIGIT_CODE.matcher(message == null ? "" : message);
        if (!match.find()) {
            call.reject("OTP code not found");
            return;
        }
        JSObject response = new JSObject();
        response.put("code", match.group(1));
        call.resolve(response);
    }

    private void finishWithError(String message) {
        PluginCall call = pendingCall;
        pendingCall = null;
        unregisterReceiver();
        if (call != null) call.reject(message);
    }

    private void stopListening(String message) {
        PluginCall call = pendingCall;
        pendingCall = null;
        unregisterReceiver();
        if (call != null) call.reject(message);
    }

    private void unregisterReceiver() {
        if (receiver == null) return;
        try {
            getContext().unregisterReceiver(receiver);
        } catch (IllegalArgumentException ignored) {
            // Receiver was already removed by the platform.
        }
        receiver = null;
    }

    @Override
    protected void handleOnDestroy() {
        stopListening("OTP reader destroyed");
    }
}
