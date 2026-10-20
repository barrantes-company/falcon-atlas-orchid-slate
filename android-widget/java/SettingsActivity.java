package com.example.sync;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

public class SettingsActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.BLACK);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(24);
        root.setPadding(pad, dp(32), pad, pad);
        scroll.addView(root, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView title = new TextView(this);
        title.setText("Ajustes");
        title.setTextColor(Color.WHITE);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        title.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        root.addView(title);

        root.addView(row("Mensajes", "Muestra el contador en el widget", WidgetProvider.KEY_SHOW_MESSAGES, true));
        root.addView(row("Llamadas", "Muestra las llamadas perdidas", WidgetProvider.KEY_SHOW_CALLS, true));
        root.addView(row("Vista previa", "El texto del aviso, no solo el nombre", WidgetProvider.KEY_PREVIEW, true));
        root.addView(row("Destello", "Reservado para la app al llegar un aviso", WidgetProvider.KEY_FLASH, true));
        root.addView(row("Push", "Aviso del sistema al llegar un mensaje", WidgetProvider.KEY_PUSH, false));

        setContentView(scroll);
    }

    private LinearLayout row(String label, String hint, String key, boolean fallback) {
        SharedPreferences prefs = getSharedPreferences(WidgetProvider.PREFS, MODE_PRIVATE);
        boolean on = prefs.getBoolean(key, fallback);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(22);
        row.setLayoutParams(params);

        LinearLayout text = new LinearLayout(this);
        text.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        textParams.rightMargin = dp(12);
        text.setLayoutParams(textParams);

        TextView name = new TextView(this);
        name.setText(label);
        name.setTextColor(Color.WHITE);
        name.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        text.addView(name);

        TextView detail = new TextView(this);
        detail.setText(hint);
        detail.setTextColor(0xFF8F8F8F);
        detail.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        text.addView(detail);

        Switch toggle = new Switch(this);
        toggle.setChecked(on);
        toggle.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton button, boolean checked) {
                prefs.edit().putBoolean(key, checked).apply();
                int messages = prefs.getInt(WidgetProvider.KEY_MESSAGES, 0);
                int calls = prefs.getInt(WidgetProvider.KEY_CALLS, 0);
                WidgetProvider.push(SettingsActivity.this, messages, calls);
            }
        });

        row.addView(text);
        row.addView(toggle);
        return row;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
