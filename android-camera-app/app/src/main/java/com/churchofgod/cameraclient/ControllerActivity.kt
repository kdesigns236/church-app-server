package com.churchofgod.cameraclient

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.churchofgod.cameraclient.databinding.ActivityControllerBinding
import com.churchofgod.cameraclient.fragments.*
import com.google.gson.Gson
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import java.net.URI

class ControllerActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityControllerBinding
    private var connectionData: ConnectionData? = null
    private var webSocketClient: WebSocketClient? = null
    private var isConnected = false
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityControllerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        parseConnectionData()
        setupUI()
        connectToServer()
        
        // Load default fragment
        loadFragment(StreamControlsFragment())
    }
    
    private fun parseConnectionData() {
        val connectionString = intent.getStringExtra("connection_data")
        if (connectionString != null) {
            try {
                connectionData = Gson().fromJson(connectionString, ConnectionData::class.java)
            } catch (e: Exception) {
                finish()
            }
        } else {
            finish()
        }
    }
    
    private fun setupUI() {
        binding.apply {
            // Display connection status
            connectionData?.let { data ->
                tvConnectionStatus.text = "Controller: ${data.server}:${data.port}"
            }
            
            // Bottom navigation
            bottomNavigation.setOnItemSelectedListener { item ->
                when (item.itemId) {
                    R.id.nav_stream -> {
                        loadFragment(StreamControlsFragment())
                        true
                    }
                    R.id.nav_cameras -> {
                        loadFragment(CameraControlsFragment())
                        true
                    }
                    R.id.nav_lower_thirds -> {
                        loadFragment(LowerThirdsFragment())
                        true
                    }
                    R.id.nav_announcements -> {
                        loadFragment(AnnouncementsFragment())
                        true
                    }
                    R.id.nav_lyrics -> {
                        loadFragment(LyricsFragment())
                        true
                    }
                    R.id.nav_bible -> {
                        loadFragment(BibleVersesFragment())
                        true
                    }
                    R.id.nav_recording -> {
                        loadFragment(RecordingControlsFragment())
                        true
                    }
                    R.id.nav_stats -> {
                        loadFragment(StreamStatsFragment())
                        true
                    }
                    R.id.nav_chat -> {
                        loadFragment(LiveChatFragment())
                        true
                    }
                    else -> false
                }
            }
            
            // Back button
            btnBack.setOnClickListener {
                finish()
            }
        }
    }
    
    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }
    
    private fun connectToServer() {
        val connData = connectionData ?: return
        
        try {
            val serverUri = URI("ws://${connData.server}:${connData.port}/controller/${connData.slot}")
            
            webSocketClient = object : WebSocketClient(serverUri) {
                override fun onOpen(handshake: ServerHandshake?) {
                    runOnUiThread {
                        isConnected = true
                        binding.tvConnectionStatus.text = "Controller Connected: ${connData.server}:${connData.port}"
                        binding.connectionIndicator.setBackgroundColor(getColor(R.color.green))
                    }
                }
                
                override fun onMessage(message: String?) {
                    // Handle incoming messages from the church app
                    runOnUiThread {
                        handleServerMessage(message)
                    }
                }
                
                override fun onClose(code: Int, reason: String?, remote: Boolean) {
                    runOnUiThread {
                        isConnected = false
                        binding.tvConnectionStatus.text = "Controller Disconnected"
                        binding.connectionIndicator.setBackgroundColor(getColor(R.color.red))
                    }
                }
                
                override fun onError(ex: Exception?) {
                    runOnUiThread {
                        binding.tvConnectionStatus.text = "Controller Connection Error"
                        binding.connectionIndicator.setBackgroundColor(getColor(R.color.red))
                    }
                }
            }
            
            webSocketClient?.connect()
            
        } catch (e: Exception) {
            binding.tvConnectionStatus.text = "Controller Connection Failed"
        }
    }
    
    private fun handleServerMessage(message: String?) {
        // Handle real-time updates from the church app
        message?.let {
            // Parse and handle different message types
            // This will sync the controller with the main app state
        }
    }
    
    fun sendControlMessage(message: String) {
        if (isConnected) {
            webSocketClient?.send(message)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        webSocketClient?.close()
    }
}
