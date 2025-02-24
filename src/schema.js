import {Schema} from "prosemirror-model"
import {schema as basicSchema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"

// Define suggestion marks
const suggestionMarks = {
    suggestion_add: {
        attrs: { 
            createdAt: { default: null },
            username: { default: 'Anonymous' },
            data: { default: null }
        },
        inclusive: true,
        parseDOM: [{ tag: "span[data-suggestion-add]" }],
        toDOM() {
            return ["span", { 
                "data-suggestion-add": "true", 
                class: "suggestion-add"
            }, 0]
        }
    },
    suggestion_delete: {
        attrs: { 
            createdAt: { default: null },
            hiddenText: { default: "" },
            username: { default: 'Anonymous' },
            data: { default: null }
        },
        inclusive: true,
        parseDOM: [{ tag: "span[data-suggestion-delete]" }],
        toDOM(node) {
            return ["span", {
                "data-suggestion-delete": "true",
                class: "suggestion-delete",
                "data-hidden-text": node.attrs.hiddenText
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
