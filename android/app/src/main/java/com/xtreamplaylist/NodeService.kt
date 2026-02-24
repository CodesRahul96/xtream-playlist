package com.xtreamplaylist

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.janeasystems.nodejsmobile.NodeJS

class NodeService : Service() {

    override fun onCreate() {
        super.onCreate()
        startForegroundService()
        
        // Start the Node.js engine
        Thread {
            // This initializes Node.js and runs 'main.js' or 'index.js' from the assets/nodejs-project folder
            NodeJS.start("main.js")
        }.start()
    }

    private fun startForegroundService() {
        val channelId = "IPTV_PROXY_CHANNEL"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "IPTV Proxy Service", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Xtream IPTV Proxy")
            .setContentText("Server is running in background")
            .setSmallIcon(android.R.drawable.stat_sys_download) // Use a system icon for now
            .build()

        startForeground(1, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
