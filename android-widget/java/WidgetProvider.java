package com.example.sync;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class WidgetProvider extends AppWidgetProvider {
    static final String PREFS = "widget_sync";
    static final String KEY_MESSAGES = "messages";
    static final String KEY_CALLS = "calls";
    static final String KEY_SHOW_MESSAGES = "show_messages";
    static final String KEY_SHOW_CALLS = "show_calls";
    static final String KEY_PREVIEW = "preview";
    static final String KEY_FLASH = "flash";
    static final String KEY_PUSH = "push";

    // Sustituye por las actividades reales de tu app.
    private static final String CHAT_ACTIVITY = "com.example.sync.ChatActivity";
    private static final String SETTINGS_ACTIVITY = "com.example.sync.SettingsActivity";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    /** Llamar cuando cambien los no leídos o las llamadas perdidas. */
    public static void push(Context context, int messages, int calls) {
        prefs(context).edit()
                .putInt(KEY_MESSAGES, Math.max(0, messages))
                .putInt(KEY_CALLS, Math.max(0, calls))
                .apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, WidgetProvider.class));
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    private static RemoteViews build(Context context) {
        SharedPreferences prefs = prefs(context);
        int messages = prefs.getBoolean(KEY_SHOW_MESSAGES, true) ? prefs.getInt(KEY_MESSAGES, 0) : -1;
        int calls = prefs.getBoolean(KEY_SHOW_CALLS, true) ? prefs.getInt(KEY_CALLS, 0) : -1;

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_sync);
        views.setTextViewText(R.id.widget_status, line(messages, calls));
        views.setOnClickPendingIntent(R.id.widget_open, open(context, CHAT_ACTIVITY, 1));
        views.setOnClickPendingIntent(R.id.widget_status, open(context, CHAT_ACTIVITY, 1));
        views.setOnClickPendingIntent(R.id.widget_root, open(context, CHAT_ACTIVITY, 1));
        views.setOnClickPendingIntent(R.id.widget_settings, open(context, SETTINGS_ACTIVITY, 2));
        return views;
    }

    private static PendingIntent open(Context context, String className, int request) {
        Intent intent = new Intent();
        intent.setClassName(context.getPackageName(), className);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, request, intent, flags);
    }

    private static String line(int messages, int calls) {
        String messagesLabel = messages < 0 ? null : (messages == 1 ? "1 mensaje" : messages + " mensajes");
        String callsLabel = calls < 0 ? null : (calls == 1 ? "1 llamada" : calls + " llamadas");
        if (messagesLabel == null) return callsLabel == null ? "" : callsLabel;
        if (callsLabel == null) return messagesLabel;
        return messagesLabel + " · " + callsLabel;
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
