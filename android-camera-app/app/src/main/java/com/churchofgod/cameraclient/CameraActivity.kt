package com.churchofgod.cameraclient

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.churchofgod.cameraclient.databinding.ActivityCameraBinding
import com.google.gson.Gson
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import java.net.URI
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.widget.SeekBar
import androidx.camera.core.CameraControl
import androidx.camera.core.CameraInfo
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.SurfaceOrientedMeteringPointFactory
import java.util.concurrent.TimeUnit

data class ConnectionData(
    val server: String,
    val port: String,
    val slot: String,
    val key: String
)

class CameraActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityCameraBinding
    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var preview: Preview? = null
    private var imageCapture: ImageCapture? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    
    private var webSocketClient: WebSocketClient? = null
    private var connectionData: ConnectionData? = null
    private var isTestMode = false
    private var isConnected = false
    private var currentCameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
    
    // Advanced camera controls
    private var cameraControl: CameraControl? = null
    private var cameraInfo: CameraInfo? = null
    private lateinit var scaleGestureDetector: ScaleGestureDetector
    private var currentZoomRatio = 1.0f
    private var isControlsVisible = true
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        parseConnectionData()
        setupUI()
        startCamera()
    }
    
    private fun parseConnectionData() {
        val connectionString = intent.getStringExtra("connection_data")
        isTestMode = intent.getBooleanExtra("test_mode", false)
        
        if (!isTestMode && connectionString != null) {
            try {
                connectionData = Gson().fromJson(connectionString, ConnectionData::class.java)
                Log.d("CameraActivity", "Connection data: $connectionData")
            } catch (e: Exception) {
                Log.e("CameraActivity", "Failed to parse connection data", e)
                Toast.makeText(this, "Invalid connection data", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
    
    @SuppressLint("ClickableViewAccessibility")
    private fun setupUI() {
        binding.apply {
            // Status display
            if (isTestMode) {
                tvStatus.text = "Test Mode - Camera Preview"
                tvConnectionInfo.text = "Testing camera functionality"
                btnConnect.visibility = View.GONE
            } else {
                tvStatus.text = "Ready to Connect"
                tvConnectionInfo.text = connectionData?.let {
                    "Server: ${it.server}:${it.port}\nSlot: Camera ${it.slot}"
                } ?: "No connection data"
            }
            
            // Connect button
            btnConnect.setOnClickListener {
                if (isConnected) {
                    disconnect()
                } else {
                    connect()
                }
            }
            
            // Switch camera button
            btnSwitchCamera.setOnClickListener {
                switchCamera()
            }
            
            // Back button
            btnBack.setOnClickListener {
                finish()
            }
            
            // Toggle controls button
            btnToggleControls.setOnClickListener {
                toggleControls()
            }
            
            // Advanced camera controls
            setupAdvancedControls()
            
            // Initially hide connect button in test mode
            if (isTestMode) {
                btnConnect.visibility = View.GONE
            }
        }
    }
    
    @SuppressLint("ClickableViewAccessibility")
    private fun setupAdvancedControls() {
        binding.apply {
            // Setup zoom gesture detector
            scaleGestureDetector = ScaleGestureDetector(this@CameraActivity, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
                override fun onScale(detector: ScaleGestureDetector): Boolean {
                    val scale = currentZoomRatio * detector.scaleFactor
                    setZoomRatio(scale)
                    return true
                }
            })
            
            // Touch to focus on preview
            previewView.setOnTouchListener { _, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        scaleGestureDetector.onTouchEvent(event)
                        if (!scaleGestureDetector.isInProgress) {
                            focusOnPoint(event.x, event.y)
                        }
                        return@setOnTouchListener true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        scaleGestureDetector.onTouchEvent(event)
                        return@setOnTouchListener true
                    }
                    MotionEvent.ACTION_UP -> {
                        scaleGestureDetector.onTouchEvent(event)
                        return@setOnTouchListener true
                    }
                }
                false
            }
            
            // Zoom slider
            seekBarZoom.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        val zoomRatio = 1.0f + (progress / 100.0f) * 9.0f // 1x to 10x zoom
                        setZoomRatio(zoomRatio)
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
            
            // Exposure slider
            seekBarExposure.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        val exposureIndex = progress - 50 // -50 to +50
                        setExposureCompensation(exposureIndex)
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
            
            // Auto focus button
            btnAutoFocus.setOnClickListener {
                triggerAutoFocus()
            }
            
            // Focus lock button
            btnFocusLock.setOnClickListener {
                toggleFocusLock()
            }
            
            // Exposure lock button
            btnExposureLock.setOnClickListener {
                toggleExposureLock()
            }
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            bindCameraUseCases()
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun bindCameraUseCases() {
        val cameraProvider = cameraProvider ?: return
        
        // Preview
        preview = Preview.Builder().build().also {
            it.setSurfaceProvider(binding.previewView.surfaceProvider)
        }
        
        // Image capture
        imageCapture = ImageCapture.Builder().build()
        
        try {
            // Unbind use cases before rebinding
            cameraProvider.unbindAll()
            
            // Bind use cases to camera
            camera = cameraProvider.bindToLifecycle(
                this,
                currentCameraSelector,
                preview,
                imageCapture
            )
            
            // Initialize camera controls
            cameraControl = camera?.cameraControl
            cameraInfo = camera?.cameraInfo
            
            // Setup zoom range
            cameraInfo?.zoomState?.observe(this) { zoomState ->
                currentZoomRatio = zoomState.zoomRatio
                updateZoomUI(zoomState.zoomRatio, zoomState.minZoomRatio, zoomState.maxZoomRatio)
            }
            
            // Setup exposure range
            setupExposureRange()
            
        } catch (exc: Exception) {
            Log.e("CameraActivity", "Use case binding failed", exc)
            Toast.makeText(this, "Camera initialization failed", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun switchCamera() {
        currentCameraSelector = if (currentCameraSelector == CameraSelector.DEFAULT_BACK_CAMERA) {
            CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }
        
        bindCameraUseCases()
        
        val cameraName = if (currentCameraSelector == CameraSelector.DEFAULT_BACK_CAMERA) {
            "Back Camera"
        } else {
            "Front Camera"
        }
        
        Toast.makeText(this, "Switched to $cameraName", Toast.LENGTH_SHORT).show()
    }
    
    // Advanced Camera Control Methods
    private fun setZoomRatio(zoomRatio: Float) {
        cameraControl?.setZoomRatio(zoomRatio)
        binding.tvZoomLevel.text = "%.1fx".format(zoomRatio)
    }
    
    private fun updateZoomUI(currentZoom: Float, minZoom: Float, maxZoom: Float) {
        val progress = ((currentZoom - minZoom) / (maxZoom - minZoom) * 100).toInt()
        binding.seekBarZoom.progress = progress
        binding.tvZoomLevel.text = "%.1fx".format(currentZoom)
    }
    
    private fun setupExposureRange() {
        cameraInfo?.exposureState?.let { exposureState ->
            val range = exposureState.exposureCompensationRange
            binding.seekBarExposure.max = range.upper - range.lower
            binding.seekBarExposure.progress = exposureState.exposureCompensationIndex - range.lower
            
            exposureState.exposureCompensationIndex.let { index ->
                binding.tvExposureLevel.text = if (index == 0) "0" else "%+d".format(index)
            }
        }
    }
    
    private fun setExposureCompensation(index: Int) {
        cameraControl?.setExposureCompensationIndex(index)
        binding.tvExposureLevel.text = if (index == 0) "0" else "%+d".format(index)
    }
    
    private fun focusOnPoint(x: Float, y: Float) {
        val factory = SurfaceOrientedMeteringPointFactory(
            binding.previewView.width.toFloat(),
            binding.previewView.height.toFloat()
        )
        val point = factory.createPoint(x, y)
        val action = FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF)
            .setAutoCancelDuration(3, TimeUnit.SECONDS)
            .build()
        
        cameraControl?.startFocusAndMetering(action)
        
        // Show focus indicator
        showFocusIndicator(x, y)
    }
    
    private fun showFocusIndicator(x: Float, y: Float) {
        binding.apply {
            focusIndicator.visibility = View.VISIBLE
            focusIndicator.x = x - focusIndicator.width / 2
            focusIndicator.y = y - focusIndicator.height / 2
            
            // Hide after 2 seconds
            focusIndicator.postDelayed({
                focusIndicator.visibility = View.GONE
            }, 2000)
        }
    }
    
    private fun triggerAutoFocus() {
        val centerPoint = SurfaceOrientedMeteringPointFactory(1f, 1f).createPoint(0.5f, 0.5f)
        val action = FocusMeteringAction.Builder(centerPoint, FocusMeteringAction.FLAG_AF)
            .setAutoCancelDuration(3, TimeUnit.SECONDS)
            .build()
        
        cameraControl?.startFocusAndMetering(action)
        Toast.makeText(this, "Auto focus triggered", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleFocusLock() {
        // Toggle focus lock implementation
        Toast.makeText(this, "Focus lock toggled", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleExposureLock() {
        // Toggle exposure lock implementation
        Toast.makeText(this, "Exposure lock toggled", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleControls() {
        isControlsVisible = !isControlsVisible
        binding.apply {
            val visibility = if (isControlsVisible) View.VISIBLE else View.GONE
            cameraControlsPanel.visibility = visibility
            
            btnToggleControls.text = if (isControlsVisible) "Hide Controls" else "Show Controls"
        }
    }
    
    private fun connect() {
        if (isTestMode) return
        
        val connData = connectionData ?: return
        
        try {
            val serverUri = URI("ws://${connData.server}:${connData.port}/camera/${connData.slot}")
            
            webSocketClient = object : WebSocketClient(serverUri) {
                override fun onOpen(handshake: ServerHandshake?) {
                    runOnUiThread {
                        isConnected = true
                        updateConnectionStatus("Connected", true)
                        Toast.makeText(this@CameraActivity, "Connected to church streaming system", Toast.LENGTH_SHORT).show()
                    }
                }
                
                override fun onMessage(message: String?) {
                    Log.d("WebSocket", "Received: $message")
                }
                
                override fun onClose(code: Int, reason: String?, remote: Boolean) {
                    runOnUiThread {
                        isConnected = false
                        updateConnectionStatus("Disconnected", false)
                        Toast.makeText(this@CameraActivity, "Disconnected from server", Toast.LENGTH_SHORT).show()
                    }
                }
                
                override fun onError(ex: Exception?) {
                    runOnUiThread {
                        isConnected = false
                        updateConnectionStatus("Connection Error", false)
                        Toast.makeText(this@CameraActivity, "Connection failed: ${ex?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
            
            webSocketClient?.connect()
            updateConnectionStatus("Connecting...", false)
            
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to connect: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun disconnect() {
        webSocketClient?.close()
        webSocketClient = null
        isConnected = false
        updateConnectionStatus("Disconnected", false)
    }
    
    private fun updateConnectionStatus(status: String, connected: Boolean) {
        binding.apply {
            tvStatus.text = status
            btnConnect.text = if (connected) "Disconnect" else "Connect"
            
            // Update status indicator color
            val color = if (connected) {
                ContextCompat.getColor(this@CameraActivity, android.R.color.holo_green_light)
            } else {
                ContextCompat.getColor(this@CameraActivity, android.R.color.holo_red_light)
            }
            
            tvStatus.setTextColor(color)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        disconnect()
    }
}
