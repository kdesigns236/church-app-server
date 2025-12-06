package com.churchofgodeveninglight.app;

import android.content.Context;
import android.util.Log;

import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;

public class BackgroundFetchHeadlessTask {
    public void onFetch(Context context, BGTask task) {
        // Obtain BackgroundFetch instance
        BackgroundFetch backgroundFetch = BackgroundFetch.getInstance(context);

        String taskId = task.getTaskId();
        boolean isTimeout = task.getTimedOut();

        Log.d("MyHeadlessTask", "BackgroundFetchHeadlessTask onFetch -- taskId: " + taskId + ", timeout=" + isTimeout);

        if (isTimeout) {
            // Must signal finish on timeout
            backgroundFetch.finish(taskId);
            return;
        }

        // Do lightweight background work here if desired.
        // All heavy / network tasks should be scheduled and handled safely when app resumes.

        // Always signal finish to the OS.
        backgroundFetch.finish(taskId);
    }
}
