package com.churchofgod.cameraclient.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.churchofgod.cameraclient.ControllerActivity
import com.churchofgod.cameraclient.R
import com.churchofgod.cameraclient.adapters.CameraSlotAdapter
import com.churchofgod.cameraclient.databinding.FragmentCameraControlsBinding
import com.churchofgod.cameraclient.models.CameraSlot
import com.google.gson.Gson

class CameraControlsFragment : Fragment() {
    
    private var _binding: FragmentCameraControlsBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var cameraSlotAdapter: CameraSlotAdapter
    
    // Exact same state as React component
    private var cameraSlots = mutableListOf(
        CameraSlot(1, "Camera 1", null, null, "disconnected", emptyList(), null),
        CameraSlot(2, "Camera 2", null, null, "disconnected", emptyList(), null),
        CameraSlot(3, "Camera 3", null, null, "disconnected", emptyList(), null)
    )
    private var activeCameraId: Int? = 1
    private var transition = "cut"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCameraControlsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
    
    private fun setupUI() {
        binding.apply {
            // Camera slots RecyclerView - exact same functionality
            cameraSlotAdapter = CameraSlotAdapter(
                onSlotClick = { slotId ->
                    activeCameraId = slotId
                    sendCameraUpdate()
                    cameraSlotAdapter.setActiveCamera(slotId)
                },
                onQrCodeClick = { slot ->
                    // Generate QR code for this slot - exact same functionality
                    sendQrCodeRequest(slot)
                },
                onNetworkClick = { slot ->
                    // Show network camera dialog - exact same functionality
                    sendNetworkCameraRequest(slot)
                },
                onSwitchConnection = { slotId, connectionId ->
                    // Switch mobile connection - exact same functionality
                    switchMobileConnection(slotId, connectionId)
                }
            )
            
            recyclerCameraSlots.layoutManager = LinearLayoutManager(requireContext())
            recyclerCameraSlots.adapter = cameraSlotAdapter
            cameraSlotAdapter.setCameraSlots(cameraSlots, activeCameraId)
            
            // Transition buttons - exact same functionality
            btnCut.setOnClickListener {
                transition = "cut"
                updateTransitionButtons()
                sendTransitionUpdate()
            }
            
            btnFade.setOnClickListener {
                transition = "fade"
                updateTransitionButtons()
                sendTransitionUpdate()
            }
            
            btnDissolve.setOnClickListener {
                transition = "dissolve"
                updateTransitionButtons()
                sendTransitionUpdate()
            }
            
            updateTransitionButtons()
        }
    }
    
    private fun updateTransitionButtons() {
        binding.apply {
            // Reset all buttons
            btnCut.setBackgroundColor(requireContext().getColor(R.color.church_gray))
            btnFade.setBackgroundColor(requireContext().getColor(R.color.church_gray))
            btnDissolve.setBackgroundColor(requireContext().getColor(R.color.church_gray))
            
            // Highlight active transition
            when (transition) {
                "cut" -> btnCut.setBackgroundColor(requireContext().getColor(R.color.blue_600))
                "fade" -> btnFade.setBackgroundColor(requireContext().getColor(R.color.blue_600))
                "dissolve" -> btnDissolve.setBackgroundColor(requireContext().getColor(R.color.blue_600))
            }
        }
    }
    
    private fun sendCameraUpdate() {
        val message = mapOf(
            "type" to "camera_switch",
            "activeCameraId" to activeCameraId,
            "cameraSlots" to cameraSlots.map { slot ->
                mapOf(
                    "id" to slot.id,
                    "name" to slot.name,
                    "status" to slot.status,
                    "mobileConnections" to slot.mobileConnections.map { conn ->
                        mapOf(
                            "id" to conn.id,
                            "deviceName" to conn.deviceName,
                            "quality" to conn.quality,
                            "batteryLevel" to conn.batteryLevel,
                            "signalStrength" to conn.signalStrength
                        )
                    },
                    "activeConnectionId" to slot.activeConnectionId
                )
            }
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun sendTransitionUpdate() {
        val message = mapOf(
            "type" to "transition_change",
            "transition" to transition
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun sendQrCodeRequest(slot: CameraSlot) {
        val message = mapOf(
            "type" to "show_qr_code",
            "slotId" to slot.id,
            "slotName" to slot.name
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun sendNetworkCameraRequest(slot: CameraSlot) {
        val message = mapOf(
            "type" to "show_network_camera",
            "slotId" to slot.id,
            "slotName" to slot.name
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun switchMobileConnection(slotId: Int, connectionId: String) {
        val slotIndex = cameraSlots.indexOfFirst { it.id == slotId }
        if (slotIndex != -1) {
            cameraSlots[slotIndex].activeConnectionId = connectionId
            cameraSlotAdapter.setCameraSlots(cameraSlots, activeCameraId)
            sendCameraUpdate()
        }
    }
    
    // Handle incoming updates from the main app
    fun updateCameraSlots(newSlots: List<CameraSlot>) {
        cameraSlots.clear()
        cameraSlots.addAll(newSlots)
        cameraSlotAdapter.setCameraSlots(cameraSlots, activeCameraId)
    }
    
    fun updateActiveCamera(newActiveCameraId: Int?) {
        activeCameraId = newActiveCameraId
        cameraSlotAdapter.setActiveCamera(newActiveCameraId)
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
