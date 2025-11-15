package com.churchofgod.cameraclient

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.churchofgod.cameraclient.databinding.ActivityChoiceBinding
import com.google.gson.Gson

data class ConnectionData(
    val server: String,
    val port: String,
    val slot: String,
    val key: String,
    val appName: String? = null
)

class ChoiceActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityChoiceBinding
    private var connectionData: ConnectionData? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChoiceBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        parseConnectionData()
        setupUI()
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
            // Display connection info
            connectionData?.let { data ->
                tvConnectionInfo.text = "Connected to: ${data.server}:${data.port}\nSlot: ${data.slot}"
            }
            
            // Camera source button
            btnJoinAsCamera.setOnClickListener {
                val intent = Intent(this@ChoiceActivity, CameraActivity::class.java)
                intent.putExtra("connection_data", intent.getStringExtra("connection_data"))
                startActivity(intent)
                finish()
            }
            
            // Controller button
            btnJoinAsController.setOnClickListener {
                val intent = Intent(this@ChoiceActivity, ControllerActivity::class.java)
                intent.putExtra("connection_data", intent.getStringExtra("connection_data"))
                startActivity(intent)
                finish()
            }
            
            // Back button
            btnBack.setOnClickListener {
                finish()
            }
        }
    }
}
