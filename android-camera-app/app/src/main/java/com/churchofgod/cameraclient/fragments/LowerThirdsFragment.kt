package com.churchofgod.cameraclient.fragments

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.churchofgod.cameraclient.ControllerActivity
import com.churchofgod.cameraclient.R
import com.churchofgod.cameraclient.databinding.FragmentLowerThirdsBinding
import com.google.gson.Gson

class LowerThirdsFragment : Fragment() {
    
    private var _binding: FragmentLowerThirdsBinding? = null
    private val binding get() = _binding!!
    
    // Exact same state as React component
    private var isVisible = false
    private var topText = "GRACE FELLOWSHIP"
    private var mainText = "SUNDAY SERVICE"
    private var logoIcon = "✝"
    private var accentColor = "#dc2626"
    private var mainBarColor = "#ffffff"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLowerThirdsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
    
    private fun setupUI() {
        binding.apply {
            // Set initial values - exact same as React
            editTopText.setText(topText)
            editMainText.setText(mainText)
            editLogoIcon.setText(logoIcon)
            
            // Text watchers for real-time updates - exact same functionality
            editTopText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    topText = s.toString()
                    sendLowerThirdUpdate()
                }
            })
            
            editMainText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    mainText = s.toString()
                    sendLowerThirdUpdate()
                }
            })
            
            editLogoIcon.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    logoIcon = s.toString()
                    sendLowerThirdUpdate()
                }
            })
            
            // Color picker listeners - exact same functionality
            colorPickerAccent.setOnColorChangedListener { color ->
                accentColor = String.format("#%06X", 0xFFFFFF and color)
                sendLowerThirdUpdate()
            }
            
            colorPickerMainBar.setOnColorChangedListener { color ->
                mainBarColor = String.format("#%06X", 0xFFFFFF and color)
                sendLowerThirdUpdate()
            }
            
            // Show/Hide button - exact same logic as toggleVisibility
            btnToggleVisibility.setOnClickListener {
                if (isVisible) {
                    isVisible = false
                    sendLowerThirdUpdate()
                } else {
                    // Show and replay animation
                    isVisible = true
                    sendLowerThirdUpdate()
                    sendReplayAnimation()
                }
                updateToggleButton()
            }
            
            // Replay animation button - exact same functionality
            btnReplayAnimation.setOnClickListener {
                sendReplayAnimation()
            }
            
            updateToggleButton()
        }
    }
    
    private fun updateToggleButton() {
        binding.apply {
            if (isVisible) {
                btnToggleVisibility.text = "Hide"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.amber_600))
                btnReplayAnimation.isEnabled = true
            } else {
                btnToggleVisibility.text = "Show"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.blue_600))
                btnReplayAnimation.isEnabled = false
            }
        }
    }
    
    private fun sendLowerThirdUpdate() {
        val message = mapOf(
            "type" to "lower_third_config",
            "isVisible" to isVisible,
            "topText" to topText,
            "mainText" to mainText,
            "logoIcon" to logoIcon,
            "accentColor" to accentColor,
            "mainBarColor" to mainBarColor
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    private fun sendReplayAnimation() {
        val message = mapOf(
            "type" to "replay_lower_third_animation"
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
