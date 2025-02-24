import {Decoration, DecorationSet} from "prosemirror-view"

export class ChangesetDecorator {
    constructor() {
        this.showDeletedText = true
    }

    createDecorations(doc, changeset) {
        const decos = []

        // Process each change in the changeset
        changeset.changes.forEach(change => {
            if (change.type === 'insertion') {
                // Add insertion decoration
                decos.push(Decoration.inline(change.from, change.to, {
                    class: 'suggestion-add'
                }))

                // Add tooltip
                decos.push(this.createTooltip(change))
            }
            else if (change.type === 'deletion') {
                if (this.showDeletedText) {
                    // Show deleted text with strikethrough
                    decos.push(Decoration.inline(change.from, change.to, {
                        class: 'suggestion-delete expanded'
                    }))
                } else {
                    // Show compact deletion marker
                    decos.push(Decoration.widget(change.from, () => {
                        const marker = document.createElement('span')
                        marker.className = 'deletion-marker'
                        
                        const tooltip = document.createElement('span')
                        tooltip.className = 'deletion-tooltip'
                        tooltip.textContent = change.slice.content.textBetween(0, change.slice.content.size, " ")
                        
                        marker.appendChild(tooltip)
                        return marker
                    }, {
                        key: `deletion-marker-${change.from}`,
                        side: 1
                    }))
                }

                // Add tooltip
                decos.push(this.createTooltip(change))
            }
        })

        return DecorationSet.create(doc, decos)
    }

    createTooltip(change) {
        return Decoration.widget(change.from, () => {
            const tooltip = document.createElement('div')
            tooltip.className = 'suggestion-tooltip'
            
            const date = new Date(change.metadata.timestamp).toLocaleDateString()
            tooltip.textContent = `${change.type === 'deletion' ? 'Deleted' : 'Added'} by ${change.metadata.user} on ${date}`
            
            return tooltip
        }, {
            key: `tooltip-${change.from}`,
            side: -1
        })
    }

    setShowDeletedText(show) {
        this.showDeletedText = show
    }
}
