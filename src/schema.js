import {Schema} from "prosemirror-model"
import {schema as basicSchema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"

// Define suggestion marks
const suggestionMarks = {
    suggestion_add: {
        attrs: { 
            username: { default: 'Anonymous' },
            timestamp: { default: 0 }
        },
        inclusive: true,
        parseDOM: [{ tag: "span.suggestion-add" }],
        toDOM() { return ["span", { class: "suggestion-add" }, 0] }
    },
    suggestion_delete: {
        attrs: { 
            username: { default: 'Anonymous' },
            timestamp: { default: 0 },
            deletedText: { default: '' }
        },
        inclusive: false,
        parseDOM: [{ 
            tag: "span.suggestion-delete",
            getAttrs(dom) {
                return {
                    username: dom.getAttribute('data-username'),
                    timestamp: Number(dom.getAttribute('data-timestamp')),
                    deletedText: dom.getAttribute('data-deleted-text')
                }
            }
        }],
        toDOM(mark) {
            return ["span", {
                class: "suggestion-delete",
                'data-username': mark.attrs.username,
                'data-timestamp': mark.attrs.timestamp,
                'data-deleted-text': mark.attrs.deletedText
            }, 0]
        }
    }
}

// Create the schema by extending the basic schema
export const schema = new Schema({
    nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
    marks: {
        ...basicSchema.spec.marks,
        ...suggestionMarks
    }
})
