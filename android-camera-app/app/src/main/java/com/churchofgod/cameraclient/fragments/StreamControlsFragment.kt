package com.churchofgod.cameraclient.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.churchofgod.cameraclient.ControllerActivity
import com.churchofgod.cameraclient.R
import com.churchofgod.cameraclient.databinding.FragmentStreamControlsBinding
import com.google.gson.Gson

class StreamControlsFragment : Fragment() {
    
    private var _binding: FragmentStreamControlsBinding? = null
    private val binding get() = _binding!!
    
    private var isLive = false
    private var streamToYoutube = true
    private var streamToFacebook = false
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStreamControlsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
    
    private fun setupUI() {
        binding.apply {
            // YouTube checkbox - exact same functionality
            checkboxYoutube.isChecked = streamToYoutube
            checkboxYoutube.setOnCheckedChangeListener { _, isChecked ->
                streamToYoutube = isChecked
                updateGoLiveButton()
                sendStreamConfigUpdate()
            }
            
            // Facebook checkbox - exact same functionality
            checkboxFacebook.isChecked = streamToFacebook
            checkboxFacebook.setOnCheckedChangeListener { _, isChecked ->
                streamToFacebook = isChecked
                updateGoLiveButton()
                sendStreamConfigUpdate()
            }
            
            // Go Live button - exact same functionality
            btnGoLive.setOnClickListener {
                isLive = !isLive
                updateGoLiveButton()
                sendStreamStateUpdate()
            }
            
            updateGoLiveButton()
        }
    }
    
    private fun updateGoLiveButton() {
        binding.apply {
            val canStream = streamToYoutube || streamToFacebook
            
            btnGoLive.isEnabled = canStream
            
            if (!canStream) {
                btnGoLive.text = "SELECT PLATFORM"
                btnGoLive.setBackgroundColor(requireContext().getColor(R.color.church_gray))
            } else if (isLive) {
                btnGoLive.text = "STOP STREAM"
                btnGoLive.setBackgroundColor(requireContext().getColor(R.color.red))
            } else {
                btnGoLive.text = "GO LIVE"
                btnGoLive.setBackgroundColor(requireContext().getColor(R.color.green))
            }
        }
    }
    
    private fun sendStreamConfigUpdate() {
        val message = mapOf(
            "type" to "stream_config",
            "youtube" to streamToYoutube,
            "facebook" to streamToFacebook
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun sendStreamStateUpdate() {
        val message = mapOf(
            "type" to "stream_state",
            "isLive" to isLive
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
