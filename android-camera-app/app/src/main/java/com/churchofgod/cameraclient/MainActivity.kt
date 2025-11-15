package com.churchofgod.cameraclient

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.churchofgod.cameraclient.databinding.ActivityMainBinding
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentIntegrator
import com.journeyapps.barcodescanner.ScanOptions

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private val CAMERA_PERMISSION_REQUEST = 100
    
    // QR Code scanner launcher
    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents == null) {
            Toast.makeText(this, "Scan cancelled", Toast.LENGTH_SHORT).show()
        } else {
            handleQRCodeResult(result.contents)
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        checkPermissions()
    }
    
    private fun setupUI() {
        binding.apply {
            // App title and branding
            tvAppTitle.text = "Church Camera"
            tvChurchName.text = "Church of God Evening Light"
            tvSubtitle.text = "Mobile Camera for Live Streaming"
            
            // Scan QR Code button
            btnScanQr.setOnClickListener {
                if (checkCameraPermission()) {
                    startQrScanner()
                } else {
                    requestCameraPermission()
                }
            }
            
            // Manual connection button
            btnManualConnect.setOnClickListener {
                showManualConnectionDialog()
            }
            
            // Test camera button
            btnTestCamera.setOnClickListener {
                if (checkCameraPermission()) {
                    startCameraTest()
                } else {
                    requestCameraPermission()
                }
            }
            
            // Instructions
            tvInstructions.text = """
                1. Tap 'Scan QR Code' to connect to the church streaming system
                2. Point your camera at the QR code displayed on the streaming computer
                3. Allow camera permissions when prompted
                4. Your phone will connect as a camera source
                
                For manual connection, tap 'Manual Connect' and enter the server details.
            """.trimIndent()
        }
    }
    
    private fun checkPermissions() {
        if (!hasCameraPermission()) {
            requestCameraPermission()
        }
    }
    
    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this, 
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO),
            CAMERA_PERMISSION_REQUEST
        )
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            CAMERA_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && 
                    grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(this, "Camera permission granted", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(
                        this, 
                        "Camera permission is required for this app to work", 
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }
    
    private fun startQRScanner() {
        val options = ScanOptions().apply {
            setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            setPrompt("Scan the QR code from the church streaming system")
            setCameraId(0) // Use back camera
            setBeepEnabled(true)
            setBarcodeImageEnabled(true)
            setOrientationLocked(false)
        }
        
        barcodeLauncher.launch(options)
    }
    
    private fun handleQRCodeResult(qrContent: String) {
        onQrCodeScanned(qrContent)
    }
    
    private fun onQrCodeScanned(result: String) {
        try {
            // Parse the connection data
            val connectionData = Gson().fromJson(result, ConnectionData::class.java)
            
            // Start choice activity to select Camera or Controller
            val intent = Intent(this, ChoiceActivity::class.java)
            intent.putExtra("connection_data", result)
            startActivity(intent)
            
        } catch (e: Exception) {
            Toast.makeText(this, "Invalid QR code format", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun showManualConnectionDialog() {
        // TODO: Implement manual connection dialog
        Toast.makeText(this, "Manual connection coming soon", Toast.LENGTH_SHORT).show()
    }
    
    private fun startCameraTest() {
        val intent = Intent(this, CameraActivity::class.java).apply {
            putExtra("test_mode", true)
        }
        startActivity(intent)
    }
}
