package com.churchofgod.cameraclient.fragments

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.SeekBar
import androidx.fragment.app.Fragment
import com.churchofgod.cameraclient.ControllerActivity
import com.churchofgod.cameraclient.R
import com.churchofgod.cameraclient.databinding.FragmentAnnouncementsBinding
import com.google.gson.Gson

class AnnouncementsFragment : Fragment() {
    
    private var _binding: FragmentAnnouncementsBinding? = null
    private val binding get() = _binding!!
    
    // Exact same state as React component
    private var isVisible = false
    private var text = ""
    private var fontSize = "text-2xl"
    private var fontFamily = "font-sans"
    private var textColor = "#ffffff"
    private var textAlign = "center"
    private var backgroundColor = "#000000"
    private var backgroundOpacity = 0.8f
    private var position = "bottom"
    private var animationStyle = "fade"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAnnouncementsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
    
    private fun setupUI() {
        binding.apply {
            // Announcement text - exact same functionality
            editAnnouncementText.setText(text)
            editAnnouncementText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    text = s.toString()
                    sendAnnouncementUpdate()
                }
            })
            
            // Font size spinner - exact same options
            spinnerFontSize.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    fontSize = when (position) {
                        0 -> "text-lg"      // Small
                        1 -> "text-2xl"     // Medium
                        2 -> "text-3xl"     // Large
                        3 -> "text-5xl"     // Extra Large
                        else -> "text-2xl"
                    }
                    sendAnnouncementUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Font family spinner - exact same options
            spinnerFontFamily.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    fontFamily = when (position) {
                        0 -> "font-sans"    // Sans-serif
                        1 -> "font-serif"   // Serif
                        2 -> "font-mono"    // Monospace
                        else -> "font-sans"
                    }
                    sendAnnouncementUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Text color picker - exact same functionality
            colorPickerText.setOnColorChangedListener { color ->
                textColor = String.format("#%06X", 0xFFFFFF and color)
                sendAnnouncementUpdate()
            }
            
            // Text align spinner - exact same options
            spinnerTextAlign.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    textAlign = when (position) {
                        0 -> "left"
                        1 -> "center"
                        2 -> "right"
                        else -> "center"
                    }
                    sendAnnouncementUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Background color picker - exact same functionality
            colorPickerBackground.setOnColorChangedListener { color ->
                backgroundColor = String.format("#%06X", 0xFFFFFF and color)
                sendAnnouncementUpdate()
            }
            
            // Background opacity slider - exact same functionality
            seekBarOpacity.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        backgroundOpacity = progress / 100f
                        tvOpacityValue.text = "${(backgroundOpacity * 100).toInt()}%"
                        sendAnnouncementUpdate()
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
            
            // Position spinner - exact same options
            spinnerPosition.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    this@AnnouncementsFragment.position = when (position) {
                        0 -> "top"
                        1 -> "middle"
                        2 -> "bottom"
                        else -> "bottom"
                    }
                    sendAnnouncementUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Animation style spinner - exact same options
            spinnerAnimation.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    animationStyle = when (position) {
                        0 -> "fade"
                        1 -> "slideUp"
                        2 -> "slideDown"
                        3 -> "scroll"
                        else -> "fade"
                    }
                    // Disable text align when scroll is selected - exact same logic
                    spinnerTextAlign.isEnabled = animationStyle != "scroll"
                    sendAnnouncementUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Show/Hide button - exact same logic as toggleVisibility
            btnToggleVisibility.setOnClickListener {
                isVisible = !isVisible
                updateToggleButton()
                sendAnnouncementUpdate()
            }
            
            // Set initial values
            seekBarOpacity.progress = (backgroundOpacity * 100).toInt()
            tvOpacityValue.text = "${(backgroundOpacity * 100).toInt()}%"
            updateToggleButton()
        }
    }
    
    private fun updateToggleButton() {
        binding.apply {
            if (isVisible) {
                btnToggleVisibility.text = "Hide Announcement"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.amber_600))
            } else {
                btnToggleVisibility.text = "Show Announcement"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.blue_600))
            }
        }
    }
    
    private fun sendAnnouncementUpdate() {
        val message = mapOf(
            "type" to "announcement_config",
            "isVisible" to isVisible,
            "text" to text,
            "fontSize" to fontSize,
            "fontFamily" to fontFamily,
            "textColor" to textColor,
            "textAlign" to textAlign,
            "backgroundColor" to backgroundColor,
            "backgroundOpacity" to backgroundOpacity,
            "position" to position,
            "animationStyle" to animationStyle
        )
        (activity as? ControllerActivity)?.sendControlMessage(Gson().toJson(message))
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
