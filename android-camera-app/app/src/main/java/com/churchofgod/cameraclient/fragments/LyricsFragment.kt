package com.churchofgod.cameraclient.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.SeekBar
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.churchofgod.cameraclient.ControllerActivity
import com.churchofgod.cameraclient.R
import com.churchofgod.cameraclient.adapters.VerseAdapter
import com.churchofgod.cameraclient.databinding.FragmentLyricsBinding
import com.churchofgod.cameraclient.models.Song
import com.google.gson.Gson

class LyricsFragment : Fragment() {
    
    private var _binding: FragmentLyricsBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var verseAdapter: VerseAdapter
    
    // Exact same song library as React component
    private val songLibrary = listOf(
        Song(
            title = "Amazing Grace",
            verses = listOf(
                "Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.",
                "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.",
                "Through many dangers, toils, and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home."
            )
        ),
        Song(
            title = "How Great Thou Art",
            verses = listOf(
                "O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made,\nI see the stars, I hear the rolling thunder,\nThy power throughout the universe displayed",
                "Then sings my soul, my Savior God, to Thee,\nHow great Thou art, how great Thou art!\nThen sings my soul, my Savior God, to Thee,\nHow great Thou art, how great Thou art!",
                "And when I think that God, His Son not sparing,\nSent Him to die, I scarce can take it in;\nThat on the cross, my burden gladly bearing,\nHe bled and died to take away my sin."
            )
        )
    )
    
    // Exact same state as React component
    private var isVisible = false
    private var selectedSong: Song? = null
    private var verseIndex = 0
    private var fontSize = "text-4xl"
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
        _binding = FragmentLyricsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
    
    private fun setupUI() {
        binding.apply {
            // Song selection spinner - exact same functionality
            val songTitles = listOf("- No Song Selected -") + songLibrary.map { it.title }
            val songAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, songTitles)
            songAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            spinnerSongs.adapter = songAdapter
            
            spinnerSongs.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    if (position == 0) {
                        selectedSong = null
                        verseIndex = 0
                    } else {
                        selectedSong = songLibrary[position - 1]
                        verseIndex = 0
                    }
                    updateVerseList()
                    updateNavigationButtons()
                    sendLyricsUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Verse list setup - exact same functionality
            verseAdapter = VerseAdapter { clickedIndex ->
                verseIndex = clickedIndex
                updateNavigationButtons()
                sendLyricsUpdate()
            }
            recyclerVerses.layoutManager = LinearLayoutManager(requireContext())
            recyclerVerses.adapter = verseAdapter
            
            // Font size spinner - exact same options
            spinnerFontSize.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    fontSize = when (position) {
                        0 -> "text-3xl"     // Small
                        1 -> "text-4xl"     // Medium
                        2 -> "text-5xl"     // Large
                        3 -> "text-6xl"     // Extra Large
                        else -> "text-4xl"
                    }
                    sendLyricsUpdate()
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
                    sendLyricsUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Text color picker - exact same functionality
            colorPickerText.setOnColorChangedListener { color ->
                textColor = String.format("#%06X", 0xFFFFFF and color)
                sendLyricsUpdate()
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
                    sendLyricsUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Background color picker - exact same functionality
            colorPickerBackground.setOnColorChangedListener { color ->
                backgroundColor = String.format("#%06X", 0xFFFFFF and color)
                sendLyricsUpdate()
            }
            
            // Background opacity slider - exact same functionality
            seekBarOpacity.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                    if (fromUser) {
                        backgroundOpacity = progress / 100f
                        tvOpacityValue.text = "${(backgroundOpacity * 100).toInt()}%"
                        sendLyricsUpdate()
                    }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
            
            // Position spinner - exact same options
            spinnerPosition.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    this@LyricsFragment.position = when (position) {
                        0 -> "top"
                        1 -> "middle"
                        2 -> "bottom"
                        else -> "bottom"
                    }
                    sendLyricsUpdate()
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
                    sendLyricsUpdate()
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
            
            // Show/Hide button - exact same logic as toggleVisibility
            btnToggleVisibility.setOnClickListener {
                isVisible = !isVisible
                updateToggleButton()
                sendLyricsUpdate()
            }
            
            // Navigation buttons - exact same logic as navigateVerse
            btnPrevVerse.setOnClickListener {
                if (selectedSong != null && verseIndex > 0) {
                    verseIndex--
                    updateNavigationButtons()
                    verseAdapter.setSelectedVerse(verseIndex)
                    sendLyricsUpdate()
                }
            }
            
            btnNextVerse.setOnClickListener {
                if (selectedSong != null && verseIndex < (selectedSong?.verses?.size ?: 0) - 1) {
                    verseIndex++
                    updateNavigationButtons()
                    verseAdapter.setSelectedVerse(verseIndex)
                    sendLyricsUpdate()
                }
            }
            
            // Set initial values
            seekBarOpacity.progress = (backgroundOpacity * 100).toInt()
            tvOpacityValue.text = "${(backgroundOpacity * 100).toInt()}%"
            updateToggleButton()
            updateNavigationButtons()
        }
    }
    
    private fun updateVerseList() {
        selectedSong?.let { song ->
            verseAdapter.setVerses(song.verses, verseIndex)
            binding.recyclerVerses.visibility = View.VISIBLE
        } ?: run {
            binding.recyclerVerses.visibility = View.GONE
        }
    }
    
    private fun updateToggleButton() {
        binding.apply {
            val canShow = selectedSong != null
            btnToggleVisibility.isEnabled = canShow
            
            if (!canShow) {
                btnToggleVisibility.text = "Select Song First"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.church_gray))
            } else if (isVisible) {
                btnToggleVisibility.text = "Hide Lyrics"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.amber_600))
            } else {
                btnToggleVisibility.text = "Show Lyrics"
                btnToggleVisibility.setBackgroundColor(requireContext().getColor(R.color.blue_600))
            }
        }
    }
    
    private fun updateNavigationButtons() {
        binding.apply {
            val hasVerses = selectedSong?.verses?.isNotEmpty() == true
            val verseCount = selectedSong?.verses?.size ?: 0
            
            btnPrevVerse.isEnabled = hasVerses && verseIndex > 0
            btnNextVerse.isEnabled = hasVerses && verseIndex < verseCount - 1
        }
    }
    
    private fun sendLyricsUpdate() {
        val message = mapOf(
            "type" to "lyrics_config",
            "isVisible" to isVisible,
            "song" to selectedSong?.let { mapOf("title" to it.title, "verses" to it.verses) },
            "verseIndex" to verseIndex,
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
