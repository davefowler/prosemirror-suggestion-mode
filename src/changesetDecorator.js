import {Decoration, DecorationSet} from "prosemirror-view"

export class ChangesetDecorator {
    constructor() {
        this.showDeletedText = true
    }

    createDecorations(doc, changeset) {
        if (!changeset || !changeset.changes) {
            console.log('No changeset or changes to decorate')
            return DecorationSet.empty
        }

        const decos = []
        const changes = Array.isArray(changeset.changes) ? changeset.changes : []
        console.log(`Creating decorations for ${changes.length} changes`)

        changes.forEach(change => {
            const metadata = {
                user: changeset.metadata?.user || 'Anonymous',
                timestamp: changeset.metadata?.timestamp || Date.now()
            }

            if (change.fromA === change.toA) {
                // Handle insertions
                decos.push(Decoration.inline(change.fromB, change.toB, {
                    class: 'suggestion-add',
                    inclusiveStart: true,
                    inclusiveEnd: false,
                    attributes: { 
                        'data-suggestion': 'add',
                        'data-inserted': change.inserted
                    }
                }))
            } else {
                // Handle deletions
                if (this.showDeletedText) {
                    decos.push(Decoration.inline(change.fromA, change.toA, {
                        class: 'suggestion-delete',
                        inclusiveStart: true,
                        inclusiveEnd: false,
                        attributes: {
                            'data-suggestion': 'delete',
                            'data-deleted-text': change.deleted
                        }
                    }))
                } else {
                    decos.push(Decoration.widget(change.fromA, () => {
                        const marker = document.createElement('span')
                        marker.className = 'deletion-marker'
                        marker.setAttribute('data-deleted-text', change.deleted)
                        return marker
                    }, { 
                        metadata,
                        side: 1 
                    }))
                }
            }
        })

        return DecorationSet.create(doc, decos)
    }

    createTooltip(change, metadata) {
        const pos = change.from
        return Decoration.widget(pos, () => {
            const tooltip = document.createElement('div')
            tooltip.className = 'suggestion-tooltip'
            
            const date = new Date(metadata.timestamp).toLocaleDateString()
            const type = change.deleted ? 'Deleted' : 'Added'
            tooltip.textContent = `${type} by ${metadata.user} on ${date}`
            
            return tooltip
        }, {
            key: `tooltip-${pos}`,
            side: -1,
            metadata
        })
    }

    setShowDeletedText(show) {
        this.showDeletedText = show
    }
}
