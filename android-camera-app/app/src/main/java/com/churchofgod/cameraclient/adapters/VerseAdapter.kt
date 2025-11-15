package com.churchofgod.cameraclient.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.churchofgod.cameraclient.R

class VerseAdapter(
    private val onVerseClick: (Int) -> Unit
) : RecyclerView.Adapter<VerseAdapter.VerseViewHolder>() {
    
    private var verses: List<String> = emptyList()
    private var selectedIndex: Int = 0
    
    fun setVerses(newVerses: List<String>, selectedIndex: Int = 0) {
        this.verses = newVerses
        this.selectedIndex = selectedIndex
        notifyDataSetChanged()
    }
    
    fun setSelectedVerse(index: Int) {
        val oldIndex = selectedIndex
        selectedIndex = index
        notifyItemChanged(oldIndex)
        notifyItemChanged(selectedIndex)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VerseViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_verse, parent, false)
        return VerseViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: VerseViewHolder, position: Int) {
        holder.bind(position, verses[position], position == selectedIndex)
    }
    
    override fun getItemCount(): Int = verses.size
    
    inner class VerseViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvVerseNumber: TextView = itemView.findViewById(R.id.tvVerseNumber)
        
        fun bind(index: Int, verse: String, isSelected: Boolean) {
            tvVerseNumber.text = "Verse ${index + 1}"
            
            // Exact same styling as React component
            if (isSelected) {
                itemView.setBackgroundColor(itemView.context.getColor(R.color.blue_900_50))
            } else {
                itemView.setBackgroundColor(itemView.context.getColor(R.color.transparent))
            }
            
            itemView.setOnClickListener {
                onVerseClick(index)
            }
        }
    }
}
