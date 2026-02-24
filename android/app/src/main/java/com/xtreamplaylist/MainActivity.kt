package com.xtreamplaylist

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import com.janeasystems.nodejsmobile.NodeJS

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val statusText = findViewById<TextView>(R.id.statusText)
        statusText.text = "Starting IPTV Proxy Server..."

        val closeButton = findViewById<androidx.appcompat.widget.AppCompatButton>(R.id.closeButton)
        closeButton.setOnClickListener {
            finish()
        }

        // Start Node.js logic via Service to keep it running in background
        val intent = Intent(this, NodeService::class.java)
        startService(intent)

        statusText.text = "IPTV Proxy is running!\nAccess: http://localhost:3000/playlist.m3u"
    }
}
